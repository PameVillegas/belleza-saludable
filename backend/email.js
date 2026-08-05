'use strict';

const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter from environment variables.
 * Returns null if required SMTP config is missing, so the app degrades gracefully.
 */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465, // true for port 465, false for others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Formats a date string (YYYY-MM-DD) to a more readable format (DD/MM/YYYY).
 */
function formatDate(dateStr) {
  if (!dateStr) return dateStr;
  // dateStr may come as a Date object or string
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString().slice(0, 10);
  const [year, month, day] = str.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formats a time string (HH:MM:SS or HH:MM) to HH:MM.
 */
function formatTime(timeStr) {
  if (!timeStr) return timeStr;
  return timeStr.slice(0, 5);
}

/**
 * Sends a booking confirmation email to the client.
 *
 * @param {Object} options
 * @param {string} options.to         - Client email address
 * @param {string} options.clientName - Client full name
 * @param {string} options.serviceName - Service name
 * @param {string} options.date       - Appointment date (YYYY-MM-DD)
 * @param {string} options.startTime  - Appointment start time (HH:MM)
 * @returns {Promise<boolean>} true if sent, false if skipped/failed
 */
async function sendBookingConfirmation({ to, clientName, serviceName, date, startTime }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('[Email] SMTP no configurado — confirmación por email omitida.');
    return false;
  }

  const fromName = process.env.SMTP_FROM_NAME || 'Belleza Saludable';
  const fromEmail = process.env.SMTP_USER;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(startTime);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmación de turno</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8f4f0;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4f0;padding:30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background-color:#c9a87c;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.5px;">✨ ¡Tu turno está confirmado!</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 20px;color:#444;font-size:16px;">
                    Hola <strong>${clientName}</strong>, tu reserva en <strong>Belleza Saludable</strong> fue registrada exitosamente.
                  </p>
                  <!-- Details card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf7f0;border:1px solid #e8d5bc;border-radius:8px;padding:0;margin-bottom:24px;">
                    <tr>
                      <td style="padding:24px 28px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:8px 0;color:#888;font-size:14px;width:120px;">Servicio</td>
                            <td style="padding:8px 0;color:#333;font-size:15px;font-weight:bold;">${serviceName}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0;color:#888;font-size:14px;">Fecha</td>
                            <td style="padding:8px 0;color:#333;font-size:15px;">${formattedDate}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0;color:#888;font-size:14px;">Hora</td>
                            <td style="padding:8px 0;color:#333;font-size:15px;">${formattedTime} hs</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 12px;color:#666;font-size:14px;">
                    Si necesitás modificar o cancelar tu turno, comunicate con nosotros con anticipación.
                  </p>
                  <p style="margin:0;color:#666;font-size:14px;">
                    ¡Te esperamos! 💆‍♀️
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f0e8dc;padding:20px 40px;text-align:center;">
                  <p style="margin:0;color:#999;font-size:12px;">Belleza Saludable · Este es un correo automático, por favor no respondas a este mensaje.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
¡Hola ${clientName}!

Tu turno en Belleza Saludable fue confirmado exitosamente.

Detalles del turno:
- Servicio: ${serviceName}
- Fecha: ${formattedDate}
- Hora: ${formattedTime} hs

Si necesitás modificar o cancelar tu turno, comunicate con nosotros con anticipación.

¡Te esperamos!
Belleza Saludable
  `.trim();

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `✅ Turno confirmado – ${serviceName} el ${formattedDate}`,
      text,
      html,
    });
    console.log(`[Email] Confirmación enviada a ${to}`);
    return true;
  } catch (err) {
    // Non-fatal: log the error but don't break the booking flow
    console.error(`[Email] Error al enviar confirmación a ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendBookingConfirmation };
