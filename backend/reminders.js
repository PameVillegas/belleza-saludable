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
 * Revisa cada minuto si hay turnos que comienzan en ~1 hora
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
 * Genera el mensaje de recordatorio
 */
function buildReminderMessage(appointment) {
  const timeStr = appointment.start_time.slice(0, 5);
  return `✨ *${BUSINESS_NAME}* ✨

Hola ${appointment.client_name.split(' ')[0]}! 👋

Te recordamos tu turno de hoy:

📅 *Hoy a las ${timeStr} hs*
💆 *Servicio:* ${appointment.service_name}
👩‍⚕️ *Profesional:* ${PROFESSIONAL_NAME}
📍 *Dirección:* ${ADDRESS}

Para *confirmar* respondé ✅
Para *cancelar* respondé ❌

Te esperamos! 💕
Recordá asistir 10 minutos antes.`;
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
 * Busca turnos que comienzan en ~1 hora y aún no tienen recordatorio enviado
 */
async function checkAndSendReminders() {
  try {
    // Hora actual en Argentina (UTC-3)
    const now = new Date();
    const argentinaOffset = -3 * 60; // minutos
    const utcOffset = now.getTimezoneOffset(); // minutos
    const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);

    const today = argentinaTime.toISOString().split('T')[0];
    const currentHour = argentinaTime.getHours();
    const currentMinute = argentinaTime.getMinutes();

    // Buscar turnos que empiezan en 55-65 minutos (ventana de 10 min)
    const targetMinutes = (currentHour * 60 + currentMinute) + 60; // 1 hora desde ahora
    const targetHour = Math.floor(targetMinutes / 60);
    const targetMin = targetMinutes % 60;
    
    // Rango: desde 55 min hasta 65 min en el futuro
    const fromMinutes = (currentHour * 60 + currentMinute) + 55;
    const toMinutes = (currentHour * 60 + currentMinute) + 65;
    
    const fromH = Math.floor(fromMinutes / 60).toString().padStart(2, '0');
    const fromM = (fromMinutes % 60).toString().padStart(2, '0');
    const toH = Math.floor(toMinutes / 60).toString().padStart(2, '0');
    const toM = (toMinutes % 60).toString().padStart(2, '0');

    const fromTime = `${fromH}:${fromM}`;
    const toTime = `${toH}:${toM}`;

    // Buscar turnos confirmados de hoy en el rango horario que no tengan recordatorio
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
         AND a.start_time >= $2
         AND a.start_time <= $3
         AND r.id IS NULL`,
      [today, fromTime, toTime]
    );

    if (result.rows.length > 0) {
      console.log(`[Recordatorios] ${new Date().toISOString()} - Encontrados ${result.rows.length} turnos para recordar`);
    }

    for (const appointment of result.rows) {
      const message = buildReminderMessage(appointment);
      const whatsappLink = buildWhatsAppLink(appointment.client_phone, message);

      // Registrar el recordatorio como enviado
      await pool.query(
        'INSERT INTO reminders_sent (appointment_id, method) VALUES ($1, $2)',
        [appointment.id, 'whatsapp_auto']
      );

      console.log(`[Recordatorio] Turno ${appointment.id} - ${appointment.client_name} (${appointment.start_time.slice(0,5)})`);

      // Enviar por WhatsApp si está conectado
      const waState = getStatus();
      if (waState.status === 'connected') {
        const sent = await sendMessage(appointment.client_phone, message);
        if (sent) {
          console.log(`  ✓ WhatsApp enviado a ${appointment.client_name}`);
        } else {
          console.log(`  ✗ No se pudo enviar WhatsApp a ${appointment.client_name}`);
        }
      } else {
        console.log(`  ⚠ WhatsApp no conectado. Recordatorio registrado pero no enviado.`);
      }
    }
  } catch (err) {
    console.error('[Recordatorios] Error:', err.message);
  }
}

/**
 * Endpoint para ver recordatorios pendientes (admin puede enviar manualmente)
 */
async function getPendingReminders() {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const utcOffset = now.getTimezoneOffset();
  const argentinaTime = new Date(now.getTime() + (utcOffset + argentinaOffset) * 60000);
  const today = argentinaTime.toISOString().split('T')[0];

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
    [today]
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
