const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { sendBookingConfirmation } = require('../email');
const { calculateEndTime, getGabinete } = require('../utils/availabilityHelpers');

let whatsappModule = null;
try { whatsappModule = require('../whatsapp'); } catch {}

const BUSINESS_PHONE = '543388403225';
const BUSINESS_NAME = 'Belleza Saludable';

function buildClientConfirmMsg(clientName, serviceName, date, startTime) {
  const d = new Date(date.split('T')[0] + 'T12:00:00');
  const dateStr = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `¡Hola ${clientName.split(' ')[0]}! 🌸\n\nTu turno fue confirmado:\n\n💆 *${serviceName}*\n📅 ${dateStr}\n⏰ ${startTime.slice(0, 5)} hs\n\n📍 Calle 30 N°416, entre calle 9 y 11\n\n⚠️ Si necesitás cancelar o modificar, avisá con anticipación al *${BUSINESS_PHONE}*.\n\n*${BUSINESS_NAME}*`;
}

function buildAdminNewApptMsg(clientName, serviceName, date, startTime, source) {
  const d = new Date(date.split('T')[0] + 'T12:00:00');
  const dateStr = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const src = source === 'manual' ? 'cargado por la administradora' : 'reservado online';
  return `📅 *Nuevo turno ${src}*\n\n👤 ${clientName}\n💆 ${serviceName}\n📅 ${dateStr}\n⏰ ${startTime.slice(0, 5)} hs`;
}

function buildCancelMsg(clientName, serviceName, date, startTime) {
  const d = new Date(date.split('T')[0] + 'T12:00:00');
  const dateStr = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `❌ *Turno cancelado*\n\n👤 ${clientName}\n💆 ${serviceName}\n📅 ${dateStr}\n⏰ ${startTime.slice(0, 5)} hs`;
}

function buildRescheduleMsg(clientName, serviceName, oldDate, oldTime, newDate, newTime) {
  const d1 = new Date(oldDate.split('T')[0] + 'T12:00:00');
  const d2 = new Date(newDate.split('T')[0] + 'T12:00:00');
  const fmt = d => d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `🔄 *Turno reprogramado*\n\n👤 ${clientName}\n💆 ${serviceName}\n\n📅 Antes: ${fmt(d1)} a las ${oldTime.slice(0, 5)} hs\n📅 Ahora: ${fmt(d2)} a las ${newTime.slice(0, 5)} hs`;
}

async function sendWa(phone, text) {
  if (!whatsappModule) return;
  try { await whatsappModule.sendMessage(phone, text); } catch {}
}

// POST /api/appointments - Público: reserva online
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { service_id, date, start_time, client_name, client_phone, client_email, notes } = req.body;

    if (!service_id || !date || !start_time || !client_name || !client_phone || !client_email) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: servicio, fecha, hora, nombre, teléfono y email.' });
    }

    await client.query('BEGIN');

    // Obtener servicio para calcular end_time
    const serviceResult = await client.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = true',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Servicio no encontrado o inactivo.' });
    }

    const service = serviceResult.rows[0];
    const end_time = calculateEndTime(start_time, service.duration_minutes);

    // Determinar gabinete del servicio
    const serviceGabinete = getGabinete(service.name);

    // Verificar disponibilidad (solo conflictos del MISMO gabinete)
    const conflictResult = await client.query(
      `SELECT a.id FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date = $1 AND a.status != 'cancelled'
       AND a.start_time < $3 AND a.end_time > $2`,
      [date, start_time, end_time]
    );

    // Filtrar solo conflictos del mismo gabinete
    let hasConflict = false;
    if (conflictResult.rows.length > 0) {
      const conflictDetails = await client.query(
        `SELECT a.id, s.name as service_name FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.date = $1 AND a.status != 'cancelled'
         AND a.start_time < $3 AND a.end_time > $2`,
        [date, start_time, end_time]
      );
      hasConflict = conflictDetails.rows.some(c => getGabinete(c.service_name) === serviceGabinete);
    }

    if (hasConflict) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'La franja horaria seleccionada ya no está disponible para este gabinete.' });
    }

    // Buscar o crear cliente
    let clientId;
    const existingClient = await client.query(
      'SELECT id FROM clients WHERE email = $1 OR phone = $2',
      [client_email, client_phone]
    );

    if (existingClient.rows.length > 0) {
      clientId = existingClient.rows[0].id;
    } else {
      const newClient = await client.query(
        'INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3) RETURNING id',
        [client_name, client_phone, client_email]
      );
      clientId = newClient.rows[0].id;
    }

    // Crear turno
    const appointmentResult = await client.query(
      `INSERT INTO appointments (client_id, service_id, date, start_time, end_time, status, source, notes)
       VALUES ($1, $2, $3, $4, $5, 'confirmed', 'online', $6)
       RETURNING *`,
      [clientId, service_id, date, start_time, end_time, notes || null]
    );

    await client.query('COMMIT');

    // Enviar confirmación por email (no bloquea la respuesta al cliente)
    sendBookingConfirmation({
      to: client_email,
      clientName: client_name,
      serviceName: service.name,
      date: appointmentResult.rows[0].date,
      startTime: appointmentResult.rows[0].start_time,
    }).catch(() => {});

    // WhatsApp: confirmación al cliente + notificación a admin
    sendWa(client_phone, buildClientConfirmMsg(client_name, service.name, appointmentResult.rows[0].date, appointmentResult.rows[0].start_time));
    sendWa(BUSINESS_PHONE, buildAdminNewApptMsg(client_name, service.name, appointmentResult.rows[0].date, appointmentResult.rows[0].start_time, 'online'));

    res.status(201).json({
      message: 'Turno reservado exitosamente.',
      appointment: appointmentResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear turno:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// GET /api/appointments/my - Público: consultar turnos por teléfono o email
router.get('/my', async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({ error: 'Parámetro de búsqueda requerido.' });
    }

    const result = await pool.query(
      `SELECT a.id, a.date, a.start_time, a.end_time, a.status, a.created_at,
              s.name as service_name, s.duration_minutes, s.price as service_price,
              c.name as client_name, c.phone as client_phone, c.email as client_email
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       WHERE (c.phone = $1 OR c.email = $1)
       ORDER BY a.date DESC, a.start_time DESC
       LIMIT 20`,
      [search]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error al buscar turnos del cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/appointments - Admin: listar turnos con filtros
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, status, client_id } = req.query;

    let query = `
      SELECT a.*, c.name as client_name, c.phone as client_phone, c.email as client_email,
             s.name as service_name, s.duration_minutes, s.price as service_price
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (date) {
      query += ` AND a.date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND a.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    // Filtro por rango de fechas (para calendario)
    if (req.query.from && req.query.to) {
      query += ` AND a.date >= $${paramIndex} AND a.date <= $${paramIndex + 1}`;
      params.push(req.query.from, req.query.to);
      paramIndex += 2;
    }

    query += ' ORDER BY a.date, a.start_time';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener turnos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/admin/appointments - Admin: carga manual
router.post('/manual', authMiddleware, async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { client_id, client_name, client_phone, client_email, service_id, date, start_time, notes } = req.body;

    if (!service_id || !date || !start_time) {
      return res.status(400).json({ error: 'Servicio, fecha y hora son requeridos.' });
    }

    await dbClient.query('BEGIN');

    // Obtener servicio
    const serviceResult = await dbClient.query(
      'SELECT * FROM services WHERE id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    const service = serviceResult.rows[0];
    const end_time = calculateEndTime(start_time, service.duration_minutes);

    // Verificar disponibilidad
    const conflictResult = await dbClient.query(
      `SELECT id FROM appointments
       WHERE date = $1 AND status != 'cancelled'
       AND start_time < $3 AND end_time > $2`,
      [date, start_time, end_time]
    );

    if (conflictResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ error: 'La franja horaria ya está ocupada.' });
    }

    // Resolver cliente
    let resolvedClientId = client_id;

    if (!resolvedClientId) {
      if (!client_name || !client_phone || !client_email) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({ error: 'Debe proporcionar client_id o datos del cliente (nombre, teléfono, email).' });
      }

      // Buscar existente
      const existing = await dbClient.query(
        'SELECT id FROM clients WHERE email = $1 OR phone = $2',
        [client_email, client_phone]
      );

      if (existing.rows.length > 0) {
        resolvedClientId = existing.rows[0].id;
      } else {
        const newClient = await dbClient.query(
          'INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3) RETURNING id',
          [client_name, client_phone, client_email]
        );
        resolvedClientId = newClient.rows[0].id;
      }
    }

    // Crear turno
    const appointmentResult = await dbClient.query(
      `INSERT INTO appointments (client_id, service_id, date, start_time, end_time, status, source, notes)
       VALUES ($1, $2, $3, $4, $5, 'confirmed', 'manual', $6)
       RETURNING *`,
      [resolvedClientId, service_id, date, start_time, end_time, notes || null]
    );

    await dbClient.query('COMMIT');

    // Obtener datos del cliente para enviar email de confirmación
    const clientData = await pool.query(
      'SELECT name, email, phone FROM clients WHERE id = $1',
      [resolvedClientId]
    );

    if (clientData.rows.length > 0 && clientData.rows[0].email) {
      sendBookingConfirmation({
        to: clientData.rows[0].email,
        clientName: clientData.rows[0].name,
        serviceName: service.name,
        date: appointmentResult.rows[0].date,
        startTime: appointmentResult.rows[0].start_time,
      }).catch(() => {});
    }

    // WhatsApp: confirmación al cliente + notificación a admin
    if (clientData.rows.length > 0 && clientData.rows[0].phone) {
      sendWa(clientData.rows[0].phone, buildClientConfirmMsg(clientData.rows[0].name, service.name, appointmentResult.rows[0].date, appointmentResult.rows[0].start_time));
    }
    sendWa(BUSINESS_PHONE, buildAdminNewApptMsg(clientData.rows[0]?.name || 'Cliente', service.name, appointmentResult.rows[0].date, appointmentResult.rows[0].start_time, 'manual'));

    res.status(201).json({
      message: 'Turno creado manualmente.',
      appointment: appointmentResult.rows[0]
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Error al crear turno manual:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    dbClient.release();
  }
});

// PUT /api/admin/appointments/:id - Admin: modificar turno
router.put('/:id', authMiddleware, async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { id } = req.params;
    const { date, start_time, service_id, notes } = req.body;

    await dbClient.query('BEGIN');

    // Obtener turno existente
    const existingResult = await dbClient.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    const existing = existingResult.rows[0];
    const newDate = date || existing.date;
    const newStartTime = start_time || existing.start_time;
    const newServiceId = service_id || existing.service_id;

    // Obtener duración del servicio
    const serviceResult = await dbClient.query('SELECT duration_minutes FROM services WHERE id = $1', [newServiceId]);
    const newEndTime = calculateEndTime(newStartTime, serviceResult.rows[0].duration_minutes);

    // Verificar disponibilidad (excluyendo el turno actual)
    const conflictResult = await dbClient.query(
      `SELECT id FROM appointments
       WHERE date = $1 AND status != 'cancelled' AND id != $4
       AND start_time < $3 AND end_time > $2`,
      [newDate, newStartTime, newEndTime, id]
    );

    if (conflictResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ error: 'La nueva franja horaria ya está ocupada.' });
    }

    const result = await dbClient.query(
      `UPDATE appointments SET date = $1, start_time = $2, end_time = $3, service_id = $4, notes = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [newDate, newStartTime, newEndTime, newServiceId, notes !== undefined ? notes : existing.notes, id]
    );

    await dbClient.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Error al modificar turno:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    dbClient.release();
  }
});

// PATCH /api/admin/appointments/:id/cancel - Admin: cancelar turno
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status != 'cancelled'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado o ya cancelado.' });
    }

    res.json({ message: 'Turno cancelado correctamente.', appointment: result.rows[0] });
  } catch (err) {
    console.error('Error al cancelar turno:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PATCH /api/appointments/:id/cancel-client - Cliente: cancelar turno (verifica por teléfono)
router.patch('/:id/cancel-client', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Teléfono requerido.' });

    const appt = await pool.query(
      `SELECT a.*, c.name as client_name, c.phone as client_phone, s.name as service_name
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = $1`, [id]
    );

    if (appt.rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    const appointment = appt.rows[0];
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Este turno ya fue cancelado.' });
    }
    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'No se puede cancelar un turno ya completado.' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const apptPhone = appointment.client_phone.replace(/[^0-9]/g, '');
    if (cleanPhone !== apptPhone && !apptPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(apptPhone)) {
      return res.status(403).json({ error: 'No tenés permiso para cancelar este turno.' });
    }

    await pool.query(`UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]);

    sendWa(BUSINESS_PHONE, buildCancelMsg(appointment.client_name, appointment.service_name, appointment.date, appointment.start_time));

    res.json({ message: 'Turno cancelado correctamente.' });
  } catch (err) {
    console.error('Error al cancelar turno (cliente):', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PUT /api/appointments/:id/reschedule - Cliente: reprogramar turno (verifica por teléfono)
router.put('/:id/reschedule', async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const { id } = req.params;
    const { phone, date, start_time } = req.body;
    if (!phone || !date || !start_time) {
      return res.status(400).json({ error: 'Teléfono, fecha y hora son requeridos.' });
    }

    const appt = await dbClient.query(
      `SELECT a.*, c.name as client_name, c.phone as client_phone, s.name as service_name, s.duration_minutes
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = $1 AND a.status != 'cancelled'`, [id]
    );

    if (appt.rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado o cancelado.' });
    }

    const appointment = appt.rows[0];
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const apptPhone = appointment.client_phone.replace(/[^0-9]/g, '');
    if (cleanPhone !== apptPhone && !apptPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(apptPhone)) {
      return res.status(403).json({ error: 'No tenés permiso para modificar este turno.' });
    }

    await dbClient.query('BEGIN');

    const newEndTime = calculateEndTime(start_time, appointment.duration_minutes);

    // Verificar disponibilidad
    const conflict = await dbClient.query(
      `SELECT id FROM appointments
       WHERE date = $1 AND status != 'cancelled' AND id != $4
       AND start_time < $3 AND end_time > $2`,
      [date, start_time, newEndTime, id]
    );

    if (conflict.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ error: 'La nueva franja horaria ya está ocupada.' });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.start_time;

    await dbClient.query(
      `UPDATE appointments SET date = $1, start_time = $2, end_time = $3, updated_at = NOW() WHERE id = $4`,
      [date, start_time, newEndTime, id]
    );

    await dbClient.query('COMMIT');

    // WhatsApp notificación a admin
    sendWa(BUSINESS_PHONE, buildRescheduleMsg(appointment.client_name, appointment.service_name, oldDate, oldTime, date, start_time));

    res.json({ message: 'Turno reprogramado correctamente.' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Error al reprogramar turno (cliente):', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
