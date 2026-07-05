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

    // Restaurar servicios si se borraron
    const svcCount = await pool.query("SELECT COUNT(*) FROM services");
    if (parseInt(svcCount.rows[0].count) < 5) {
      console.log('[Setup] Restaurando servicios...');
      const servicios = [
        ['Limpieza Facial Profunda', 'Protocolo de higiene integral que incluye desincrustación de impurezas, extracción de comedones y recuperación del manto hidrolipídico. Ideal para oxigenar los tejidos y devolver la luminosidad natural.', 60, 35000],
        ['Limpieza Facial Profunda + Perfilado de Cejas', 'El cuidado clínico de la piel se combina con el diseño de la mirada, logrando un rostro renovado y armónico en una sola sesión.', 60, 40000],
        ['Limpieza Premium', 'Una experiencia potenciada con activos de alta gama y máscaras específicas según el biotipo cutáneo, enfocada en una hidratación profunda y efecto revitalizante inmediato. Combinado con cabina LED.', 60, 40000],
        ['Peelings Químicos', 'Exfoliación química controlada mediante el uso de ácidos (AHA/BHA) para tratar hiperpigmentaciones, secuelas de acné y fotoenvejecimiento, estimulando la renovación celular desde las capas más profundas. Precio base.', 60, 40000],
        ['Peeling Mecánico (Microdermoabrasión/Espátula Ultrasónica/Dermaplaning)', 'Remoción mecánica del estrato córneo para suavizar irregularidades, mejorar la permeabilidad cutánea y lograr una textura de porcelana. Precio base.', 60, 40000],
        ['Microneedling / Dermapen', 'Terapia de inducción de colágeno mediante microperforaciones que estimulan los mecanismos naturales de reparación de la piel, tratando arrugas finas, poros dilatados y flacidez. Precio base.', 60, 40000],
        ['Microneedling con Exosomas y Activos', 'Biotecnología avanzada aplicada a la estética. Utilizamos exosomas y principios activos específicos (como PDRN) para una regeneración celular acelerada y una reparación dérmica de última generación. Precio base.', 60, 40000],
        ['Peeling Químico + Microneedling con Exosomas', 'Protocolo de rejuvenecimiento global y corrección profunda. Peeling químico adaptado seguido de Microneedling con exosomas para potenciar la regeneración celular, síntesis de colágeno y reparación dérmica. Precio base.', 60, 40000],
        ['Cabina LED Facial', 'Terapia de fotobiomodulación con diferentes longitudes de onda. Roja para rejuvenecimiento, Azul para acné, Verde para manchas. Reduce inflamación, acelera reparación tisular y potencia síntesis de colágeno y elastina.', 30, 30000],
        ['Lifting de Pestañas', 'Técnica de curvado desde la raíz que acentúa la longitud y dirección de tus pestañas naturales, con un efecto de apertura de mirada que dura semanas.', 60, 25000],
        ['Lifting de Pestañas + Perfilado de Cejas', 'El combo ideal para definir tu mirada de forma natural y elegante, ajustando la forma de tus cejas a tu morfología facial.', 75, 30000],
        ['Perfilado de Cejas', 'Diseño personalizado basado en visagismo para resaltar tus facciones y dar marco al rostro.', 20, 8000],
        ['Laminado de Cejas', 'Procedimiento para direccionar y disciplinar los vellos de las cejas, logrando un aspecto más poblado, definido y prolijo.', 60, 25000],
        ['Laminado de Cejas + Perfilado', 'Máxima definición y volumen para tus cejas, combinando técnica de fijación y diseño manual.', 75, 30000],
        ['Ondas Rusas', 'Electroestimulación de alta intensidad que trabaja sobre las fibras musculares para combatir la flacidez, mejorar el tono y favorecer el retorno venoso. Consultar precio por pack.', 30, 0],
        ['Ondas Rusas + Presoterapia', 'Sinergia perfecta para tonificar y favorecer la eliminación de toxinas y líquidos retenidos mediante el drenaje linfático mecánico. Consultar precio.', 60, 0],
        ['Lipoláser (por zona)', 'Técnica de láser diodo de baja intensidad que promueve la lipólisis en zonas críticas de forma segura y sin dolor.', 30, 25000],
        ['Lipoláser + Presoterapia', 'Combina la degradación de lípidos con un drenaje inmediato para acelerar la eliminación de la adiposidad tratada y mejorar la circulación. Consultar precio.', 60, 0],
        ['Lipoláser + Ondas Rusas', 'Tratamiento de choque que ataca la grasa localizada y refuerza la estructura muscular de la zona al mismo tiempo. Consultar precio.', 60, 0],
        ['Presoterapia', 'Masaje neumático que estimula el sistema linfático, ideal para piernas cansadas, reducción de edemas y mejora de la celulitis. Consultar precio.', 45, 0],
        ['Depilación Definitiva', 'Tecnología de vanguardia para la eliminación progresiva del vello, garantizando una piel suave y libre de foliculitis. Consultá por promos en zonas combinadas.', 30, 0],
      ];
      for (const [name, desc, dur, price] of servicios) {
        await pool.query('INSERT INTO services (name, description, duration_minutes, price) VALUES ($1, $2, $3, $4)', [name, desc, dur, price]);
      }
      console.log('[Setup] ✓ Servicios restaurados');
    }

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

    // Productos
    const prodCount = await pool.query("SELECT COUNT(*) FROM products");
    if (parseInt(prodCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price) VALUES
        ('Crema Hidratante Facial', 'Crema hidratante de uso diario con ácido hialurónico y vitamina E.', 18500),
        ('Sérum Vitamina C', 'Sérum concentrado con vitamina C pura al 15%. Antioxidante, ilumina.', 22000),
        ('Protector Solar FPS 50+', 'Protector solar oil-free, apto para pieles sensibles.', 15000),
        ('Agua Micelar Limpiadora', 'Limpiador facial suave que remueve maquillaje sin enjuague.', 12000),
        ('Contorno de Ojos Anti-age', 'Reduce ojeras, bolsas y líneas de expresión. Con retinol.', 25000)
      `);
      console.log('[Setup] ✓ Productos insertados');
    }

    console.log('[Setup] ✓ Base de datos lista');
  } catch (err) {
    console.error('[Setup] Error (el servidor continúa):', err.message);
  }
});
