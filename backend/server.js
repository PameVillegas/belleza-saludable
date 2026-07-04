require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (panel.html, cliente.html)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const schedulesRoutes = require('./routes/schedules');
const clientsRoutes = require('./routes/clients');
const appointmentsRoutes = require('./routes/appointments');
const availabilityRoutes = require('./routes/availability');
const productsRoutes = require('./routes/products');
const incomeRoutes = require('./routes/income');
const reviewsRoutes = require('./routes/reviews');

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/admin/services', servicesRoutes);
app.use('/api/admin/schedules', schedulesRoutes);
app.use('/api/admin/clients', clientsRoutes);
app.use('/api/admin/appointments', appointmentsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/admin/products', productsRoutes);
app.use('/api/admin/income', incomeRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin/reviews', reviewsRoutes);

// Sistema de recordatorios automáticos por WhatsApp
const { startRemindersCron, getPendingReminders } = require('./reminders');
let whatsapp = null;
try {
  whatsapp = require('./whatsapp');
  whatsapp.initWhatsApp().catch(err => {
    console.error('[WhatsApp] No se pudo inicializar (Chromium no disponible?):', err.message);
    whatsapp = null;
  });
} catch (err) {
  console.error('[WhatsApp] Módulo no disponible:', err.message);
  whatsapp = null;
}
startRemindersCron();

// Endpoint admin: ver recordatorios del día
app.get('/api/admin/reminders', require('./middleware/auth'), async (req, res) => {
  try {
    const reminders = await getPendingReminders();
    res.json(reminders);
  } catch (err) {
    console.error('Error al obtener recordatorios:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// Endpoint admin: estado de WhatsApp (QR, conectado, etc.)
app.get('/api/admin/whatsapp/status', require('./middleware/auth'), (req, res) => {
  if (!whatsapp) return res.json({ status: 'unavailable' });
  const status = whatsapp.getStatus();
  res.json(status);
});

// Endpoint admin: desconectar WhatsApp
app.post('/api/admin/whatsapp/logout', require('./middleware/auth'), async (req, res) => {
  if (!whatsapp) return res.json({ message: 'WhatsApp no disponible.' });
  await whatsapp.logout();
  res.json({ message: 'Sesión de WhatsApp cerrada.' });
});

// Endpoint admin: reiniciar WhatsApp (genera nuevo QR)
app.post('/api/admin/whatsapp/restart', require('./middleware/auth'), async (req, res) => {
  if (!whatsapp) return res.json({ message: 'WhatsApp no disponible en este servidor.' });
  await whatsapp.restart();
  res.json({ message: 'Reiniciando WhatsApp... Esperá unos segundos y refrescá para ver el QR.' });
});

// Endpoint admin: enviar mensaje manual por WhatsApp
app.post('/api/admin/whatsapp/send', require('./middleware/auth'), async (req, res) => {
  if (!whatsapp) return res.status(500).json({ error: 'WhatsApp no disponible.' });
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Se requiere phone y message.' });
  }
  const sent = await whatsapp.sendMessage(phone, message);
  if (sent) {
    res.json({ success: true, message: 'Mensaje enviado.' });
  } else {
    res.status(500).json({ success: false, error: 'No se pudo enviar. Verificá que WhatsApp esté conectado.' });
  }
});

// En producción, servir el build de React para rutas no-API
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

  // Rutas de páginas estáticas
  app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'panel.html'));
  });

  app.get('/cliente', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'cliente.html'));
  });

  // Cualquier otra ruta va al React SPA
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
