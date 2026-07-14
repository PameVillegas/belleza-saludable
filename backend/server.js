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
  // NO inicializar automáticamente - solo cuando admin lo pida
  console.log('[WhatsApp] Módulo cargado (esperando conexión manual)');
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
    if (status.status === 'disconnected') {
      // Primera conexión o reconexión
      await whatsapp.initWhatsApp();
      res.json({ message: 'Iniciando WhatsApp... El QR aparecerá en unos segundos.' });
    } else {
      await whatsapp.restart();
      res.json({ message: 'Reiniciando WhatsApp... El QR aparecerá en unos segundos.' });
    }
  } catch (err) {
    console.error('[WhatsApp restart error]', err);
    res.status(500).json({ error: err.message });
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

    // Restaurar servicios solo si no hay suficientes
    const svcCount = await pool.query("SELECT COUNT(*) FROM services");
    if (parseInt(svcCount.rows[0].count) < 20) {
      console.log('[Setup] Restaurando servicios...');
      await pool.query("DELETE FROM appointments WHERE source = 'manual' AND client_id IN (SELECT id FROM clients WHERE phone LIKE '3388%')").catch(() => {});
      await pool.query("DELETE FROM services");
      const servicios = [
        // FACIALES: Salud y Renovación Cutánea
        ['Limpieza Facial Profunda', 'Protocolo de higiene integral que incluye desincrustación de impurezas, extracción de comedones y recuperación del manto hidrolipídico. Ideal para oxigenar los tejidos y devolver la luminosidad natural.', 60, 35000],
        ['Limpieza Facial Profunda + Perfilado de Cejas', 'El cuidado clínico de la piel se combina con el diseño de la mirada, logrando un rostro renovado y armónico en una sola sesión.', 60, 40000],
        ['Limpieza Premium', 'Una experiencia potenciada con activos de alta gama y máscaras específicas según el biotipo cutáneo. Enfocada en una hidratación profunda y efecto revitalizante inmediato. Combinado con cabina LED.', 60, 40000],
        ['Peeling Mecánico - Microdermoabrasión', 'Punta de Diamante. Exfoliación mecánica controlada que utiliza cabezales abrasivos para remover células muertas y pulir la superficie cutánea. Ideal para suavizar poros y líneas finas. Sujeto a evaluación profesional.', 60, 40000],
        ['Dermaplaning "Glow"', 'Técnica de exfoliación física que utiliza una hoja de bisturí quirúrgico para remover suavemente la capa superior de células muertas y el vello facial fino. Resultado: piel increíblemente luminosa y tersa.', 60, 40000],
        ['Peelings Químicos', 'Exfoliación química controlada mediante el uso de ácidos (AHA/BHA) para tratar hiperpigmentaciones, secuelas de acné y fotoenvejecimiento, estimulando la renovación celular desde las capas más profundas. Precio base.', 60, 40000],
        ['Peeling Químico Técnica Layering', 'Protocolo de vanguardia con aplicación estratificada de diferentes agentes químicos en capas sucesivas. Cada activo actúa de forma sinérgica en distintos niveles de la epidermis. Ideal para tratar múltiples inesteticismos en una sola sesión. Sujeto a evaluación profesional.', 60, 40000],
        ['Cabina LED Facial', 'Terapia de fotobiomodulación que utiliza diferentes longitudes de onda para estimular respuestas celulares (rejuvenecimiento, acné o manchas). Reduce la inflamación y acelera la reparación tisular.', 30, 30000],
        // BIOREGENERACIÓN AVANZADA
        ['Microneedling / Dermapen', 'Terapia de inducción de colágeno mediante microperforaciones que estimulan los mecanismos naturales de reparación de la piel, tratando arrugas finas, poros dilatados y flacidez. Sujeto a evaluación profesional.', 60, 40000],
        ['Microneedling con Exosomas y Activos', 'Biotecnología de última generación (Exosomas y PDRN) para una regeneración acelerada y una reparación dérmica profunda. Sujeto a evaluación profesional.', 60, 40000],
        ['Peeling Químico + Microneedling con Exosomas', 'Protocolo de corrección profunda. La sinergia del peeling químico y los exosomas potencia exponencialmente la renovación celular y la firmeza, logrando resultados superiores en textura y tono. Sujeto a evaluación profesional.', 60, 40000],
        // MIRADA Y DISEÑO
        ['Lifting de Pestañas', 'Curvado desde la raíz que acentúa la longitud natural con efecto de apertura de mirada.', 60, 25000],
        ['Lifting de Pestañas + Perfilado de Cejas', 'Combo integral para definir la mirada de forma natural y elegante.', 75, 30000],
        ['Perfilado de Cejas', 'Diseño personalizado basado en visagismo facial.', 20, 8000],
        ['Laminado de Cejas', 'Técnica para direccionar y disciplinar los vellos, logrando cejas más pobladas y definidas.', 60, 25000],
        ['Laminado de Cejas + Perfilado', 'Máxima definición y volumen mediante técnica de fijación y diseño manual.', 75, 30000],
        // CORPORALES
        ['Ondas Rusas', 'Electroestimulación de alta intensidad para combatir la flacidez, mejorar el tono muscular y favorecer el retorno venoso. Consultar precio.', 30, 0],
        ['Ondas Rusas + Lipoláser', 'Protocolo intensivo de remodelación. El Lipoláser promueve la liberación de ácidos grasos (lipólisis), mientras que las Ondas Rusas potencian el consumo energético muscular, mejorando la firmeza y reduciendo contornos. Consultar precio.', 60, 0],
        ['Ondas Rusas + Presoterapia', 'Sinergia para tonificar y favorecer la eliminación de toxinas y líquidos retenidos. Consultar precio.', 60, 0],
        ['Lipoláser (por zona)', 'Láser diodo de baja intensidad que promueve la eliminación de grasa en zonas críticas de forma no invasiva. Consultar precio.', 30, 0],
        ['Lipoláser + Presoterapia', 'Degradación de lípidos combinada con drenaje inmediato para acelerar la eliminación de la adiposidad y mejorar la circulación. Consultar precio.', 60, 0],
        ['Presoterapia', 'Masaje neumático para el sistema linfático. Ideal para edemas, piernas cansadas y mejora de la celulitis. Consultar precio.', 45, 0],
        // DEPILACIÓN
        ['Depilación Definitiva', 'Tecnología de vanguardia para la eliminación progresiva del vello. Consultá por nuestras promos en zonas combinadas y combos.', 45, 0],
      ];
      for (const [name, desc, dur, price] of servicios) {
        await pool.query('INSERT INTO services (name, description, duration_minutes, price) VALUES ($1, $2, $3, $4)', [name, desc, dur, price]);
      }
      console.log('[Setup] ✓ Servicios actualizados');
    } else {
      console.log('[Setup] Servicios ya existen, verificando faltantes...');
      // Agregar servicios que falten - FORZAR inserción
      const missing = [
        ['Dermaplaning "Glow"', 'Técnica de exfoliación física que utiliza una hoja de bisturí quirúrgico para remover suavemente la capa superior de células muertas y el vello facial fino (vello de durazno). Resultado: piel increíblemente luminosa y tersa.', 60, 40000],
        ['Peeling Químico Técnica Layering', 'Protocolo de vanguardia con aplicación estratificada de diferentes agentes químicos en capas sucesivas. Cada activo actúa de forma sinérgica en distintos niveles de la epidermis. Ideal para tratar múltiples inesteticismos en una sola sesión. Sujeto a evaluación profesional.', 60, 40000],
        ['Ondas Rusas + Lipoláser', 'Protocolo intensivo de remodelación. El Lipoláser promueve la liberación de ácidos grasos (lipólisis), mientras que las Ondas Rusas potencian el consumo energético muscular, mejorando la firmeza y reduciendo contornos. Consultar precio.', 60, 0],
        ['Cabina LED Facial', 'Terapia de fotobiomodulación que utiliza diferentes longitudes de onda para estimular respuestas celulares (rejuvenecimiento, acné o manchas). Reduce la inflamación y acelera la reparación tisular.', 30, 30000],
      ];
      for (const [name, desc, dur, price] of missing) {
        const exists = await pool.query("SELECT id FROM services WHERE name = $1", [name]);
        if (exists.rows.length === 0) {
          // Intentar insertar
          try {
            await pool.query('INSERT INTO services (name, description, duration_minutes, price) VALUES ($1, $2, $3, $4)', [name, desc, dur, price]);
            console.log(`[Setup] ✓ Servicio agregado: ${name}`);
          } catch (e) {
            console.log(`[Setup] No se pudo agregar ${name}: ${e.message}`);
          }
        }
      }
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

    // Productos - vaciar para que admin los cargue manualmente
    const hasLabProducts = await pool.query("SELECT id FROM products WHERE name LIKE '%Laboratorio%' OR name LIKE '%Lab Beauté%' OR name LIKE '%Idraet%' OR name LIKE '%Miradror%' OR name LIKE '%Sérum%'");
    if (hasLabProducts.rows.length > 0) {
      await pool.query("DELETE FROM products");
      console.log('[Setup] ✓ Productos vaciados (admin los carga manualmente)');
    }

    console.log('[Setup] ✓ Base de datos lista');
  } catch (err) {
    console.error('[Setup] Error (el servidor continúa):', err.message);
  }
});
