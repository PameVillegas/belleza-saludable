const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCodeLib = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

let sock = null;
let waStatus = 'disconnected';
let currentQR = null;
let qrDataUrl = null;

const AUTH_DIR = path.join(__dirname, '..', '.wwebjs_auth', 'baileys');

/**
 * Inicializar WhatsApp con Baileys
 */
async function initWhatsApp() {
  try {
    console.log('[WhatsApp] Iniciando conexión...');
    
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    console.log('[WhatsApp] Auth state cargado');

    const baileys = require('@whiskeysockets/baileys');
    const makeSocket = baileys.default || baileys.makeWASocket;

    sock = makeSocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: baileys.Browsers.ubuntu('Chrome'),
    });
    console.log('[WhatsApp] Socket creado');

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('[WhatsApp] Connection update:', JSON.stringify({ connection, hasQR: !!qr }));

      if (qr) {
        waStatus = 'qr_pending';
        currentQR = qr;
        try {
          qrDataUrl = await QRCodeLib.toDataURL(qr, { width: 300, margin: 2 });
          console.log('[WhatsApp] QR data URL generado');
        } catch (err) {
          console.error('[WhatsApp] Error generando QR:', err.message);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log('[WhatsApp] Cerrado. Código:', statusCode);

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          waStatus = 'disconnected';
          currentQR = null;
          qrDataUrl = null;
          try { if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
        } else {
          waStatus = 'disconnected';
          setTimeout(() => initWhatsApp(), 5000);
        }
      }

      if (connection === 'open') {
        waStatus = 'connected';
        currentQR = null;
        qrDataUrl = null;
        console.log('[WhatsApp] ✓ Conectado');
      }
    });

    return 'ok';
  } catch (err) {
    console.error('[WhatsApp] Error en initWhatsApp:', err.message, err.stack);
    waStatus = 'error';
    return err.message;
  }
}

/**
 * Enviar mensaje
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
    console.log(`[WhatsApp] ✓ Enviado a ${cleanPhone}`);
    return true;
  } catch (err) {
    console.error(`[WhatsApp] ✗ Error:`, err.message);
    return false;
  }
}

/**
 * Estado actual
 */
function getStatus() {
  return {
    status: waStatus,
    qrDataUrl: waStatus === 'qr_pending' ? qrDataUrl : null
  };
}

/**
 * Cerrar sesión
 */
async function logout() {
  if (sock) {
    try { await sock.logout(); } catch {}
    try { sock.end(); } catch {}
    sock = null;
  }
  waStatus = 'disconnected';
  currentQR = null;
  qrDataUrl = null;
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch {}
  console.log('[WhatsApp] Sesión cerrada');
}

/**
 * Reiniciar (nuevo QR)
 */
async function restart() {
  if (sock) {
    try { sock.end(); } catch {}
    sock = null;
  }
  waStatus = 'disconnected';
  currentQR = null;
  qrDataUrl = null;
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch {}
  setTimeout(() => initWhatsApp(), 2000);
}

module.exports = { initWhatsApp, sendMessage, getStatus, logout, restart };
