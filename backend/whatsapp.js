const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCodeLib = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

let sock = null;
let waStatus = 'disconnected';
let qrDataUrl = null;

const SESSION_DIR = path.join(__dirname, '..', 'wa_session');

async function initWhatsApp() {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    console.log('[WhatsApp] Conectando con versión:', version);

    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
      if (qr) {
        waStatus = 'qr_pending';
        try {
          qrDataUrl = await QRCodeLib.toDataURL(qr, { width: 300, margin: 2 });
        } catch (e) {
          console.error('[WhatsApp] Error QR:', e.message);
        }
        console.log('[WhatsApp] QR listo para escanear');
      }

      if (connection === 'open') {
        waStatus = 'connected';
        qrDataUrl = null;
        console.log('[WhatsApp] ✓ Conectado');
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('[WhatsApp] Desconectado. Código:', code);
        waStatus = 'disconnected';
        qrDataUrl = null;

        if (code === 401 || code === 403) {
          // Sesión inválida, borrar y no reconectar
          try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}
        } else {
          // Reconectar
          setTimeout(() => initWhatsApp(), 5000);
        }
      }
    });

    return 'ok';
  } catch (err) {
    console.error('[WhatsApp] Error:', err.message);
    waStatus = 'error';
    return err.message;
  }
}

async function sendMessage(phone, text) {
  if (waStatus !== 'connected' || !sock) return false;
  try {
    let clean = phone.replace(/[^0-9]/g, '');
    if (!clean.startsWith('54')) clean = '54' + clean;
    const jid = `${clean}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    console.log(`[WhatsApp] ✓ Enviado a ${clean}`);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Error envío:', err.message);
    return false;
  }
}

function getStatus() {
  return { status: waStatus, qrDataUrl };
}

async function logout() {
  if (sock) {
    try { await sock.logout(); } catch {}
    try { sock.end(); } catch {}
    sock = null;
  }
  waStatus = 'disconnected';
  qrDataUrl = null;
  try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}
}

async function restart() {
  if (sock) {
    try { sock.end(); } catch {}
    sock = null;
  }
  waStatus = 'disconnected';
  qrDataUrl = null;
  try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}
  await initWhatsApp();
}

module.exports = { initWhatsApp, sendMessage, getStatus, logout, restart };
