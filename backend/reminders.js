const pool = require('./db/pool');
let whatsappModule = null;
try {
  whatsappModule = require('./whatsapp');
} catch (err) {
  console.log('[Recordatorios] WhatsApp module no disponible');
}

const { sendMessage, getStatus } = whatsappModule || { sendMessage: () => false, getStatus: () => ({ status: 'unavailable' }) };

// Número de WhatsApp del negocio (sin +)
const BUSINESS_PHONE = '543388403225';
const BUSINESS_NAME = 'Belleza Saludable';
const PROFESSIONAL_NAME = 'Mariana Farias';
const ADDRESS = 'Calle 30 N°416, entre calle 9 y 11';

/**
 * Sistema de recordatorios automáticos por WhatsApp
 * Revisa cada minuto si hay turnos confirmados para MAÑANA
 * y envía un mensaje de recordatorio al cliente.
 * 
 * Usa la API de WhatsApp Cloud (Meta) si está configurada,
 * o genera links para envío manual.
 */

// Tabla para rastrear recordatorios enviados (evitar duplicados)
async function ensureReminderTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminders_sent (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id),
        sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
        method VARCHAR(50) DEFAULT 'whatsapp_link'
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON reminders_sent(appointment_id)
    `);
  } catch (err) {
    console.error('Error creando tabla de recordatorios:', err.message);
  }
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function formatDateTime(dateInput) {
  const raw = dateInput instanceof Date ? dateInput : new Date(String(dateInput).split('T')[0] + 'T12:00:00');
  const weekday = WEEKDAYS[raw.getDay()];
  return `${weekday} ${raw.getDate()}/${raw.getMonth() + 1}`;
}

/**
 * Genera el mensaje de recordatorio (neutro: incluye el día exacto del turno)
 */
function buildReminderMessage(appointment) {
  const dateStr = formatDateTime(appointment.date);
  const timeStr = appointment.start_time.slice(0, 5) + ' hs';
  return `¡Hola ${appointment.client_name.split(' ')[0]}! 🌸\n\nRecordá tu turno del *${dateStr}* a las *${timeStr}* — ${appointment.service_name}.\n\n📍Te espero en calle 30 N 416, al lado de Pami entre calle 9 y 11.\n\n❗️Si no podés tomar el turno, avisá con antelación. Para mí es importante poder reorganizar la agenda y/o dar lugar a otras personas interesadas en tomar tu horario 💫`;
}

/**
 * Genera el link de WhatsApp para envío
 */
function buildWhatsAppLink(phone, message) {
  // Limpiar número (solo dígitos)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // Si no empieza con código de país, agregar Argentina
  const fullPhone = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
}

/**
 * Busca turnos confirmados de la TARDE de HOY que empiezan en ~60 minutos
 * y que aún no tienen recordatorio enviado. Los turnos de la mañana
 * se envían manualmente desde el panel (noche anterior).
 */
async function checkAndSendReminders() {
  try {
    // Hora actual en Argentina (UTC-3)
    const now = new Date();
    const argentinaOffset = -3 * 60; // minutos
    const utcOffset = now.getTimezoneOffset(); // minutos
    const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);

    // Hoy en Argentina
    const today = argentinaTime.toISOString().split('T')[0];
    const [hh, mm] = [String(argentinaTime.getHours()).padStart(2, '0'), String(argentinaTime.getMinutes()).padStart(2, '0')];
    const nowTime = `${hh}:${mm}`;

    // Ventana: turno empieza en (ahora, ahora + 60 min]
    const limit = new Date(argentinaTime.getTime() + 60 * 60000);
    const limitTime = `${String(limit.getHours()).padStart(2, '0')}:${String(limit.getMinutes()).padStart(2, '0')}`;

    // Turnos confirmados de la tarde (>= 12:00) de hoy, sin recordatorio aún
    const result = await pool.query(
      `SELECT a.id, a.date, a.start_time, a.end_time,
              c.name as client_name, c.phone as client_phone, c.email as client_email,
              s.name as service_name
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       LEFT JOIN reminders_sent r ON r.appointment_id = a.id
       WHERE a.date = $1
         AND a.status = 'confirmed'
         AND a.start_time >= '12:00'
         AND a.start_time > $2
         AND a.start_time <= $3
         AND r.id IS NULL`,
      [today, nowTime, limitTime]
    );

    if (result.rows.length > 0) {
      console.log(`[Recordatorios] ${new Date().toISOString()} - Encontrados ${result.rows.length} turnos para recordar`);
    }

    for (const appointment of result.rows) {
      const message = buildReminderMessage(appointment);

      console.log(`[Recordatorio] Turno ${appointment.id} - ${appointment.client_name} (${appointment.start_time.slice(0,5)})`);

      // Solo enviar si WhatsApp está conectado
      const waState = getStatus();
      if (waState.status !== 'connected') {
        console.log(`  ⚠ WhatsApp no conectado. Recordatorio pendiente, se reintentará en el próximo ciclo.`);
        continue;
      }

      const sent = await sendMessage(appointment.client_phone, message);
      if (sent) {
        // Marcar como enviado SOLO si el mensaje realmente llegó
        await pool.query(
          'INSERT INTO reminders_sent (appointment_id, method) VALUES ($1, $2)',
          [appointment.id, 'whatsapp_auto']
        );
        console.log(`  ✓ WhatsApp enviado a ${appointment.client_name}`);
      } else {
        console.log(`  ✗ No se pudo enviar WhatsApp a ${appointment.client_name}. Se reintentará.`);
      }
    }
  } catch (err) {
    console.error('[Recordatorios] Error:', err.message);
  }
}

/**
 * Endpoint para ver recordatorios de un día (admin puede enviar manualmente)
 * targetDate: 'today' (default), 'tomorrow' o una fecha YYYY-MM-DD
 * period: 'all' (default) | 'morning' | 'afternoon'
 */
async function getPendingReminders(targetDate = 'today', period = 'all') {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const utcOffset = now.getTimezoneOffset();
  const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);
  const today = argentinaTime.toISOString().split('T')[0];
  const tomorrow = new Date(argentinaTime.getTime() + 86400000).toISOString().split('T')[0];

  let date = today;
  if (targetDate === 'tomorrow') date = tomorrow;
  else if (targetDate && targetDate !== 'today') date = String(targetDate).split('T')[0];

  const periodFilter = period === 'morning' ? `AND a.start_time < '12:00'`
    : period === 'afternoon' ? `AND a.start_time >= '12:00'`
    : '';

  const result = await pool.query(
    `SELECT a.id, a.date, a.start_time,
            c.name as client_name, c.phone as client_phone,
            s.name as service_name,
            r.id as reminder_id
     FROM appointments a
     JOIN clients c ON a.client_id = c.id
     JOIN services s ON a.service_id = s.id
     LEFT JOIN reminders_sent r ON r.appointment_id = a.id
     WHERE a.date = $1 AND a.status = 'confirmed'
     ${periodFilter}
     ORDER BY a.start_time`,
    [date]
  );

  return result.rows.map(row => ({
    ...row,
    reminder_sent: !!row.reminder_id,
    whatsapp_link: buildWhatsAppLink(row.client_phone, buildReminderMessage(row))
  }));
}

/**
 * Envía de una vez los recordatorios de TODOS los turnos de la mañana
 * del día siguiente (botón del panel: un click). Marca como enviado
 * SOLO si el mensaje realmente llegó.
 */
async function sendMorningRemindersForTomorrow() {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const utcOffset = now.getTimezoneOffset();
  const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);
  const tomorrow = new Date(argentinaTime.getTime() + 86400000).toISOString().split('T')[0];

  const result = await pool.query(
    `SELECT a.id, a.date, a.start_time,
            c.name as client_name, c.phone as client_phone,
            s.name as service_name
     FROM appointments a
     JOIN clients c ON a.client_id = c.id
     JOIN services s ON a.service_id = s.id
     LEFT JOIN reminders_sent r ON r.appointment_id = a.id
     WHERE a.date = $1
       AND a.status = 'confirmed'
       AND a.start_time < '12:00'
       AND r.id IS NULL
     ORDER BY a.start_time`,
    [tomorrow]
  );

  const total = result.rows.length;
  let sent = 0;
  let pending = 0;

  for (const appointment of result.rows) {
    const message = buildReminderMessage(appointment);

    const waState = getStatus();
    if (waState.status !== 'connected') {
      pending++;
      console.log(`  ⚠ WhatsApp no conectado. ${appointment.client_name} (${appointment.start_time.slice(0,5)}) quedó pendiente.`);
      continue;
    }

    const ok = await sendMessage(appointment.client_phone, message);
    if (ok) {
      await pool.query(
        'INSERT INTO reminders_sent (appointment_id, method) VALUES ($1, $2)',
        [appointment.id, 'manual_morning']
      );
      sent++;
      console.log(`  ✓ Mañana: WhatsApp enviado a ${appointment.client_name}`);
    } else {
      pending++;
      console.log(`  ✗ No se pudo enviar a ${appointment.client_name}.`);
    }
  }

  return { tomorrow, total, sent, pending };
}

/**
 * Iniciar el cron de recordatorios (cada minuto)
 */
function startRemindersCron() {
  ensureReminderTable();
  console.log('[Recordatorios] Sistema de recordatorios automáticos iniciado (cada 1 min)');
  
  // Ejecutar inmediatamente una vez
  checkAndSendReminders();
  
  // Luego cada minuto
  setInterval(checkAndSendReminders, 60 * 1000);
}

module.exports = { startRemindersCron, getPendingReminders, sendMorningRemindersForTomorrow, buildWhatsAppLink, buildReminderMessage };
