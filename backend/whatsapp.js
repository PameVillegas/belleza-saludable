const { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const QRCode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

let sock = null;
let waStatus = 'disconnected'; // disconnected, qr_pending, connected
let currentQR = null;
let qrDataUrl = null;

const AUTH_DIR = path.join(__dirname, '..', '.wwebjs_auth', 'baileys');

/**
 * Inicializar WhatsApp con Baileys
 */
async function initWhatsApp() {
  try {
    // Crear directorio de auth si no existe
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['Belleza Saludable', 'Chrome', '1.0.0'],
    });

    // Guardar credenciales
    sock.ev.on('creds.update', saveCreds);

    // Manejar conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        waStatus = 'qr_pending';
        currentQR = qr;
        // Generar QR como data URL para el panel admin
        const QRCodeLib = require('qrcode');
        try {
          qrDataUrl = await QRCodeLib.toDataURL(qr, { width: 300 });
        } catch (err) {
          console.error('[WhatsApp] Error generando QR:', err.message);
        }
        console.log('[WhatsApp] QR generado - Esperando escaneo...');
        QRCode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log('[WhatsApp] Desconectado. Razón:', reason);

        if (reason === DisconnectReason.loggedOut) {
          // Sesión cerrada, borrar auth y no reconectar
          waStatus = 'disconnected';
          currentQR = null;
          qrDataUrl = null;
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          console.log('[WhatsApp] Sesión cerrada. Necesita escanear QR de nuevo.');
        } else {
          // Reconectar
          waStatus = 'disconnected';
          console.log('[WhatsApp] Reconectando...');
          setTimeout(() => initWhatsApp(), 3000);
        }
      }

      if (connection === 'open') {
        waStatus = 'connected';
        currentQR = null;
        qrDataUrl = null;
        console.log('[WhatsApp] ✓ Conectado y listo para enviar mensajes');
      }
    });

  } catch (err) {
    console.error('[WhatsApp] Error al inicializar:', err.message);
    waStatus = 'error';
  }
}

/**
 * Enviar mensaje por WhatsApp
 */
async function sendMessage(phone, message) {
  if (waStatus !== 'connected' || !sock) {
    console.log('[WhatsApp] No conectado.');
    return false;
  }

  try {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('54')) {
      cleanPhone = '54' + cleanPhone;
    }

    const jid = cleanPhone + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] ✓ Mensaje enviado a ${cleanPhone}`);
    return true;
  } catch (err) {
    console.error(`[WhatsApp] ✗ Error enviando:`, err.message);
    return false;
  }
}

/**
 * Obtener estado actual
 */
function getStatus() {
  return {
    status: waStatus,
    qrDataUrl: waStatus === 'qr_pending' ? qrDataUrl : null
  };
}

/**
 * Desconectar / cerrar sesión
 */
async function logout() {
  if (sock) {
    try {
      await sock.logout();
    } catch {}
    sock = null;
  }
  waStatus = 'disconnected';
  currentQR = null;
  qrDataUrl = null;
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  console.log('[WhatsApp] Sesión cerrada');
}

/**
 * Reiniciar (generar nuevo QR)
 */
async function restart() {
  if (sock) {
    try {
      sock.end();
    } catch {}
    sock = null;
  }
  waStatus = 'disconnected';
  currentQR = null;
  qrDataUrl = null;
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  setTimeout(() => initWhatsApp(), 2000);
}

module.exports = { initWhatsApp, sendMessage, getStatus, logout, restart };
