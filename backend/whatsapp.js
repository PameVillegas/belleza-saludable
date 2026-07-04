const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const pool = require('./db/pool');

let waClient = null;
let waStatus = 'disconnected'; // disconnected, qr_pending, connected
let currentQR = null;
let qrDataUrl = null;

/**
 * Asegurar tabla para guardar sesión de WhatsApp
 */
async function ensureSessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_session (
      id INTEGER PRIMARY KEY DEFAULT 1,
      session_data TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

/**
 * Guardar sesión en BD
 */
async function saveSession(sessionData) {
  await pool.query(`
    INSERT INTO whatsapp_session (id, session_data, updated_at) 
    VALUES (1, $1, NOW())
    ON CONFLICT (id) DO UPDATE SET session_data = $1, updated_at = NOW()
  `, [JSON.stringify(sessionData)]);
}

/**
 * Cargar sesión desde BD
 */
async function loadSession() {
  const result = await pool.query('SELECT session_data FROM whatsapp_session WHERE id = 1');
  if (result.rows.length > 0 && result.rows[0].session_data) {
    try {
      return JSON.parse(result.rows[0].session_data);
    } catch { return null; }
  }
  return null;
}

/**
 * Inicializar cliente de WhatsApp
 */
async function initWhatsApp() {
  await ensureSessionTable();

  // Usar LocalAuth para mantener sesión en disco
  waClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '..', '.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions'
      ]
    }
  });

  waClient.on('qr', async (qr) => {
    waStatus = 'qr_pending';
    currentQR = qr;
    // Generar QR como data URL para mostrar en el panel admin
    try {
      qrDataUrl = await qrcode.toDataURL(qr, { width: 300 });
    } catch (err) {
      console.error('[WhatsApp] Error generando QR image:', err.message);
    }
    console.log('[WhatsApp] QR generado - Esperando escaneo...');
  });

  waClient.on('ready', () => {
    waStatus = 'connected';
    currentQR = null;
    qrDataUrl = null;
    console.log('[WhatsApp] ✓ Conectado y listo para enviar mensajes');
  });

  waClient.on('authenticated', () => {
    console.log('[WhatsApp] ✓ Autenticado correctamente');
  });

  waClient.on('auth_failure', (msg) => {
    waStatus = 'disconnected';
    console.error('[WhatsApp] ✗ Error de autenticación:', msg);
  });

  waClient.on('disconnected', (reason) => {
    waStatus = 'disconnected';
    currentQR = null;
    qrDataUrl = null;
    console.log('[WhatsApp] Desconectado:', reason);
  });

  try {
    await waClient.initialize();
  } catch (err) {
    console.error('[WhatsApp] Error al inicializar:', err.message);
    waStatus = 'error';
  }
}

/**
 * Enviar mensaje por WhatsApp
 * @param {string} phone - Número de teléfono (ej: 3388403225, 543388403225)
 * @param {string} message - Mensaje de texto
 * @returns {boolean} - true si se envió correctamente
 */
async function sendMessage(phone, message) {
  if (waStatus !== 'connected' || !waClient) {
    console.log('[WhatsApp] No conectado. No se puede enviar mensaje.');
    return false;
  }

  try {
    // Limpiar número
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Asegurar código de país Argentina
    if (!cleanPhone.startsWith('54')) {
      cleanPhone = '54' + cleanPhone;
    }
    
    // Formato WhatsApp: código país + número + @c.us
    const chatId = cleanPhone + '@c.us';
    
    await waClient.sendMessage(chatId, message);
    console.log(`[WhatsApp] ✓ Mensaje enviado a ${cleanPhone}`);
    return true;
  } catch (err) {
    console.error(`[WhatsApp] ✗ Error enviando a ${phone}:`, err.message);
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
 * Desconectar WhatsApp
 */
async function logout() {
  if (waClient) {
    try {
      await waClient.logout();
      waStatus = 'disconnected';
      currentQR = null;
      qrDataUrl = null;
      console.log('[WhatsApp] Sesión cerrada');
    } catch (err) {
      console.error('[WhatsApp] Error al cerrar sesión:', err.message);
    }
  }
}

/**
 * Reiniciar conexión (para volver a generar QR)
 */
async function restart() {
  if (waClient) {
    try {
      await waClient.destroy();
    } catch {}
  }
  waStatus = 'disconnected';
  currentQR = null;
  qrDataUrl = null;
  
  // Re-inicializar
  setTimeout(() => initWhatsApp(), 2000);
}

module.exports = { initWhatsApp, sendMessage, getStatus, logout, restart };
