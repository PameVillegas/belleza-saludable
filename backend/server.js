require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
  // Iniciar automáticamente al arrancar
  whatsapp.initWhatsApp().then((r) => {
    console.log('[WhatsApp] Init result:', r);
  }).catch(err => {
    console.error('[WhatsApp] Init error:', err.message);
  });
  console.log('[WhatsApp] Módulo cargado, inicializando...');
} catch (err) {
  console.error('[WhatsApp] No se pudo cargar:', err.message);
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
  if (!whatsapp) return res.json({ status: 'unavailable', error: 'module not loaded' });
  const status = whatsapp.getStatus();
  res.json(status);
});

// Endpoint público para debug (temporal)
app.get('/api/whatsapp-test', async (req, res) => {
  try {
    const baileys = require('@whiskeysockets/baileys');
    res.json({ ok: true, keys: Object.keys(baileys).slice(0, 10), moduleLoaded: !!whatsapp, status: whatsapp ? whatsapp.getStatus() : 'null' });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
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
  try {
    const status = whatsapp.getStatus();
    let result;
    if (status.status === 'disconnected' || status.status === 'error') {
      result = await whatsapp.initWhatsApp();
    } else {
      await whatsapp.restart();
      result = 'restarted';
    }
    res.json({ message: 'WhatsApp iniciado.', result });
  } catch (err) {
    console.error('[WhatsApp restart error]', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
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

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  
  // Ejecutar migración y seed al arrancar
  const pool = require('./db/pool');
  try {
    console.log('[Setup] Verificando base de datos...');
    
    // Crear tablas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        password VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration_minutes INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
      CREATE TABLE IF NOT EXISTS blocked_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        reason VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id),
        service_id UUID NOT NULL REFERENCES services(id),
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        source VARCHAR(20) NOT NULL DEFAULT 'online',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        image_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID,
        client_name VARCHAR(255) NOT NULL,
        service_name VARCHAR(255),
        stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
        text TEXT NOT NULL,
        is_approved BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reminders_sent (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id),
        sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
        method VARCHAR(50) DEFAULT 'whatsapp_link'
      );
    `);

    // Agregar columnas si faltan
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='image_url') THEN
          ALTER TABLE services ADD COLUMN image_url TEXT;
        END IF;
      END $$;
    `);

    console.log('[Setup] ✓ Tablas OK');

    // Servicios: se gestionan SOLO desde el panel admin (no se tocan al reiniciar)

    // Admin
    const adminCount = await pool.query("SELECT COUNT(*) FROM admins");
    if (parseInt(adminCount.rows[0].count) === 0) {
      await pool.query("INSERT INTO admins (username, password, name) VALUES ('MariF', 'Mari26', 'Mariana Farias')");
    } else {
      // Actualizar credenciales del admin existente
      await pool.query("UPDATE admins SET username = 'MariF', password = 'Mari26' WHERE username = 'admin' OR username = 'MariF'");
    }
    // Eliminar otros admins que no sean Mariana
    await pool.query("DELETE FROM admins WHERE username != 'MariF'");

    // Horarios
    const schedCount = await pool.query("SELECT COUNT(*) FROM schedules");
    if (parseInt(schedCount.rows[0].count) === 0) {
      for (let day = 1; day <= 5; day++) {
        await pool.query('INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES ($1, $2, $3, $4, $5)', [day, '09:00', '12:00', 60, true]);
        await pool.query('INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES ($1, $2, $3, $4, $5)', [day, '14:00', '19:00', 60, true]);
      }
    }

    // Clientes de prueba
    const clientCount = await pool.query("SELECT COUNT(*) FROM clients");
    if (parseInt(clientCount.rows[0].count) < 3) {
      const clientes = [
        ['María López', '3388111111', 'maria.lopez@email.com'],
        ['Carolina Pérez', '3388222222', 'carolina.perez@email.com'],
        ['Luciana Martínez', '3388333333', 'luciana.martinez@email.com'],
        ['Valentina Rodríguez', '3388444444', 'valentina.rodriguez@email.com'],
        ['Sofía García', '3388555555', 'sofia.garcia@email.com'],
        ['Florencia Díaz', '3388666666', 'florencia.diaz@email.com'],
        ['Andrea Morales', '3388777777', 'andrea.morales@email.com'],
        ['Camila Torres', '3388888888', 'camila.torres@email.com'],
      ];
      for (const [name, phone, email] of clientes) {
        await pool.query('INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [name, phone, email]);
      }
      console.log('[Setup] ✓ Clientes de prueba insertados');
    }

    // Reseñas
    const revCount = await pool.query("SELECT COUNT(*) FROM reviews");
    if (parseInt(revCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO reviews (client_name, service_name, stars, text, is_approved) VALUES
        ('María L.', 'Limpieza Facial Profunda', 5, 'Excelente atención, mi piel cambió muchísimo. Se nota la dedicación y el profesionalismo en cada sesión.', true),
        ('Carolina P.', 'Peelings Químicos', 5, 'Los tratamientos faciales son increíbles. Mariana te explica todo y te hace sentir muy cómoda.', true),
        ('Luciana M.', 'Ondas Rusas + Presoterapia', 5, 'Llevo 6 meses con las ondas rusas y presoterapia, los resultados son notorios. Super recomendable.', true),
        ('Valentina R.', 'Microneedling / Dermapen', 5, 'El microneedling me cambió la piel por completo. Las marcas de acné se redujeron muchísimo.', true),
        ('Sofía G.', 'Lifting de Pestañas', 5, 'Me hice el lifting de pestañas y quedé encantada. La mirada se abre totalmente, muy natural.', true),
        ('Florencia D.', 'Limpieza Premium', 4, 'Muy buena la limpieza premium, sentí la piel súper hidratada y luminosa por días.', true)
      `);
      console.log('[Setup] ✓ Reseñas insertadas');
    }

    // Productos: se gestionan SOLO desde el panel admin (no se tocan al reiniciar)

    console.log('[Setup] ✓ Base de datos lista');
  } catch (err) {
    console.error('[Setup] Error (el servidor continúa):', err.message);
  }
});
