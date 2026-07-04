const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

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

    // Verificar disponibilidad (prevenir doble reserva)
    const conflictResult = await client.query(
      `SELECT id FROM appointments
       WHERE date = $1 AND status != 'cancelled'
       AND start_time < $3 AND end_time > $2`,
      [date, start_time, end_time]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'La franja horaria seleccionada ya no está disponible.' });
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

// Calcular hora de fin a partir de hora inicio + duración
function calculateEndTime(startTime, durationMinutes) {
  const parts = startTime.split(':');
  const totalMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]) + durationMinutes;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = router;
