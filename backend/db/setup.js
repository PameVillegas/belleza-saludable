/**
 * Script combinado de setup: migración + seed de datos de prueba
 * Se ejecuta en el startCommand de Render antes del server
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Forzar production para SSL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')) {
  process.env.NODE_ENV = 'production';
}

const pool = require('./pool');

async function setup() {
  const client = await pool.connect();
  try {
    console.log('[Setup] Iniciando migración y seed...');

    // === MIGRACIÓN: Crear todas las tablas ===
    await client.query(`
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

    // Agregar columnas si no existen (para BD ya existentes)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='username') THEN
          ALTER TABLE clients ADD COLUMN username VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='password') THEN
          ALTER TABLE clients ADD COLUMN password VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='image_url') THEN
          ALTER TABLE services ADD COLUMN image_url TEXT;
        END IF;
      END $$;
    `);

    console.log('[Setup] ✓ Tablas creadas/verificadas');

    // === RESTAURAR SERVICIOS si se borraron ===
    const existingServices = await client.query("SELECT COUNT(*) FROM services");
    if (parseInt(existingServices.rows[0].count) < 5) {
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

      for (const [name, description, duration, price] of servicios) {
        await client.query(
          `INSERT INTO services (name, description, duration_minutes, price) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [name, description, duration, price]
        );
      }
      console.log(`[Setup] ✓ ${servicios.length} servicios restaurados`);
    } else {
      console.log('[Setup] Servicios ya existen, no se tocan.');
    }

    // Restaurar admin si no existe
    const existingAdmin = await client.query("SELECT COUNT(*) FROM admins");
    if (parseInt(existingAdmin.rows[0].count) === 0) {
      await client.query(`INSERT INTO admins (username, password, name) VALUES ('admin', 'admin123', 'Mariana Farias') ON CONFLICT DO NOTHING`);
      console.log('[Setup] ✓ Admin restaurado');
    }

    // Restaurar horarios si no existen
    const existingSchedules = await client.query("SELECT COUNT(*) FROM schedules");
    if (parseInt(existingSchedules.rows[0].count) === 0) {
      for (let day = 1; day <= 5; day++) {
        await client.query(`INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES ($1, $2, $3, $4, $5)`, [day, '09:00', '12:00', 60, true]);
        await client.query(`INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES ($1, $2, $3, $4, $5)`, [day, '14:00', '19:00', 60, true]);
      }
      console.log('[Setup] ✓ Horarios restaurados');
    }

    // === SEED: Datos de prueba ===
    // Solo insertar si no hay clientes de prueba
    const existingClients = await client.query("SELECT COUNT(*) FROM clients WHERE phone LIKE '3388-%'");
    const clientCount = parseInt(existingClients.rows[0].count);

    if (clientCount < 5) {
      console.log('[Setup] Insertando clientes de prueba...');

      const clientes = [
        ['María López', '3388-111111', 'maria.lopez@email.com'],
        ['Carolina Pérez', '3388-222222', 'carolina.perez@email.com'],
        ['Luciana Martínez', '3388-333333', 'luciana.martinez@email.com'],
        ['Valentina Rodríguez', '3388-444444', 'valentina.rodriguez@email.com'],
        ['Sofía García', '3388-555555', 'sofia.garcia@email.com'],
        ['Florencia Díaz', '3388-666666', 'florencia.diaz@email.com'],
        ['Andrea Morales', '3388-777777', 'andrea.morales@email.com'],
        ['Camila Torres', '3388-888888', 'camila.torres@email.com'],
      ];

      for (const [name, phone, email] of clientes) {
        await client.query(
          `INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [name, phone, email]
        );
      }
      console.log(`[Setup] ✓ ${clientes.length} clientes insertados`);
    } else {
      console.log('[Setup] Clientes de prueba ya existen, saltando...');
    }

    // Insertar turnos de prueba si no hay
    const existingAppts = await client.query("SELECT COUNT(*) FROM appointments");
    if (parseInt(existingAppts.rows[0].count) < 5) {
      console.log('[Setup] Insertando turnos de prueba...');
      
      const servicesRes = await client.query('SELECT id, duration_minutes FROM services WHERE is_active = true LIMIT 5');
      const clientsRes = await client.query("SELECT id FROM clients WHERE phone LIKE '3388-%' LIMIT 5");

      if (servicesRes.rows.length > 0 && clientsRes.rows.length > 0) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const turnos = [
          { clientIdx: 0, serviceIdx: 0, date: todayStr, time: '09:00', status: 'confirmed' },
          { clientIdx: 1, serviceIdx: 1, date: todayStr, time: '10:00', status: 'confirmed' },
          { clientIdx: 2, serviceIdx: 2, date: todayStr, time: '14:00', status: 'confirmed' },
          { clientIdx: 3, serviceIdx: 0, date: tomorrowStr, time: '09:00', status: 'confirmed' },
          { clientIdx: 4, serviceIdx: 1, date: tomorrowStr, time: '10:00', status: 'confirmed' },
          { clientIdx: 0, serviceIdx: 0, date: yesterdayStr, time: '09:00', status: 'completed' },
          { clientIdx: 1, serviceIdx: 1, date: yesterdayStr, time: '10:00', status: 'completed' },
          { clientIdx: 2, serviceIdx: 2, date: twoDaysAgoStr, time: '14:00', status: 'completed' },
          { clientIdx: 3, serviceIdx: 0, date: twoDaysAgoStr, time: '15:00', status: 'completed' },
          { clientIdx: 4, serviceIdx: 1, date: twoDaysAgoStr, time: '16:00', status: 'completed' },
        ];

        for (const turno of turnos) {
          const svc = servicesRes.rows[turno.serviceIdx % servicesRes.rows.length];
          const cli = clientsRes.rows[turno.clientIdx % clientsRes.rows.length];
          const totalMin = parseInt(turno.time.split(':')[0]) * 60 + parseInt(turno.time.split(':')[1]) + svc.duration_minutes;
          const endTime = `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;

          await client.query(
            `INSERT INTO appointments (client_id, service_id, date, start_time, end_time, status, source)
             VALUES ($1, $2, $3, $4, $5, $6, 'manual')
             ON CONFLICT DO NOTHING`,
            [cli.id, svc.id, turno.date, turno.time, endTime, turno.status]
          ).catch(() => {}); // Ignorar errores de conflicto
        }
        console.log('[Setup] ✓ Turnos de prueba insertados');
      }
    }

    // Insertar productos si no hay
    const existingProducts = await client.query("SELECT COUNT(*) FROM products");
    if (parseInt(existingProducts.rows[0].count) === 0) {
      console.log('[Setup] Insertando productos de prueba...');
      await client.query(`
        INSERT INTO products (name, description, price) VALUES
        ('Crema Hidratante Facial', 'Crema hidratante de uso diario con ácido hialurónico y vitamina E. Ideal para pieles secas y mixtas.', 18500),
        ('Sérum Vitamina C', 'Sérum concentrado con vitamina C pura al 15%. Antioxidante, ilumina y unifica el tono.', 22000),
        ('Protector Solar FPS 50+', 'Protector solar oil-free, apto para pieles sensibles. No deja residuo blanco.', 15000),
        ('Agua Micelar Limpiadora', 'Limpiador facial suave que remueve maquillaje e impurezas sin enjuague.', 12000),
        ('Contorno de Ojos Anti-age', 'Reduce ojeras, bolsas y líneas de expresión. Con retinol y péptidos.', 25000),
        ('Máscara Hidratante Nocturna', 'Mascarilla overnight que repara y nutre la piel. Con ceramidas.', 19000)
      `);
      console.log('[Setup] ✓ Productos insertados');
    }

    // Insertar reseñas si no hay
    const existingReviews = await client.query("SELECT COUNT(*) FROM reviews");
    if (parseInt(existingReviews.rows[0].count) === 0) {
      console.log('[Setup] Insertando reseñas de prueba...');
      await client.query(`
        INSERT INTO reviews (client_name, service_name, stars, text, is_approved) VALUES
        ('María L.', 'Limpieza Facial Profunda', 5, 'Excelente atención, mi piel cambió muchísimo. Se nota la dedicación y el profesionalismo en cada sesión.', true),
        ('Carolina P.', 'Peelings Químicos', 5, 'Los tratamientos faciales son increíbles. Mariana te explica todo y te hace sentir muy cómoda.', true),
        ('Luciana M.', 'Ondas Rusas + Presoterapia', 5, 'Llevo 6 meses con las ondas rusas y presoterapia, los resultados son notorios. Super recomendable.', true),
        ('Valentina R.', 'Microneedling / Dermapen', 5, 'El microneedling me cambió la piel por completo. Las marcas de acné se redujeron muchísimo.', true),
        ('Sofía G.', 'Lifting de Pestañas', 5, 'Me hice el lifting de pestañas y quedé encantada. La mirada se abre totalmente, muy natural.', true),
        ('Florencia D.', 'Limpieza Premium', 4, 'Muy buena la limpieza premium, sentí la piel súper hidratada y luminosa por días.', true),
        ('Andrea M.', 'Presoterapia', 5, 'La presoterapia es lo mejor para las piernas cansadas. Salís como nueva.', true),
        ('Camila T.', 'Laminado de Cejas', 5, 'Me encanta el laminado de cejas, quedan perfectas y prolijas por semanas.', true)
      `);
      console.log('[Setup] ✓ Reseñas insertadas');
    }

    console.log('[Setup] ✓ Setup completado exitosamente');
  } catch (err) {
    console.error('[Setup] ERROR:', err.message);
    console.error('[Setup] Stack:', err.stack);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

setup();
