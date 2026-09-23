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

/**
 * Genera el mensaje de recordatorio (se envía el día anterior)
 */
function buildReminderMessage(appointment) {
  const raw = appointment.date instanceof Date ? appointment.date : new Date(String(appointment.date).split('T')[0] + 'T12:00:00');
  const dateStr = `${raw.getDate()}/${raw.getMonth() + 1}`;
  const t = appointment.start_time.slice(0, 5);
  const timeStr = t.slice(3, 5) === '00' ? `${Number(t.slice(0, 2))}hs` : `${t.replace(/^0/, '')}hs`;
  return `¡Hola ${appointment.client_name.split(' ')[0]}! 🌸\n\nRecordá tu turno de *mañana* a las *${timeStr}* (${dateStr}) — ${appointment.service_name}.\n\n📍Te espero en calle 30 N 416, al lado de Pami entre calle 9 y 11.\n\n❗️Si no podés tomar el turno, avisá con antelación. Para mí es importante poder reorganizar la agenda y/o dar lugar a otras personas interesadas en tomar tu horario 💫`;
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
 * Busca turnos confirmados de MAÑANA que aún no tienen recordatorio enviado
 */
async function checkAndSendReminders() {
  try {
    // Hora actual en Argentina (UTC-3)
    const now = new Date();
    const argentinaOffset = -3 * 60; // minutos
    const utcOffset = now.getTimezoneOffset(); // minutos
    const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);

    // Mañana en Argentina
    const tomorrow = new Date(argentinaTime.getTime() + 86400000).toISOString().split('T')[0];

    // Buscar turnos confirmados de mañana que no tengan recordatorio
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
         AND r.id IS NULL`,
      [tomorrow]
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
 * Endpoint para ver recordatorios del día (admin puede enviar manualmente)
 * Acepta una fecha opcional (YYYY-MM-DD); por defecto usa el día HOY.
 */
async function getPendingReminders(targetDate = null) {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const utcOffset = now.getTimezoneOffset();
  const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);
  const today = argentinaTime.toISOString().split('T')[0];
  const date = targetDate || today;

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

module.exports = { startRemindersCron, getPendingReminders, buildWhatsAppLink, buildReminderMessage };
