require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');

async function seedTestData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Crear clientes de prueba
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

    const clientIds = [];
    for (const [name, phone, email] of clientes) {
      const existing = await client.query('SELECT id FROM clients WHERE email = $1 OR phone = $2', [email, phone]);
      if (existing.rows.length > 0) {
        clientIds.push(existing.rows[0].id);
      } else {
        const res = await client.query(
          'INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3) RETURNING id',
          [name, phone, email]
        );
        clientIds.push(res.rows[0].id);
      }
    }

    // Obtener servicios existentes
    const servicesRes = await client.query('SELECT id, duration_minutes FROM services WHERE is_active = true LIMIT 10');
    const services = servicesRes.rows;

    if (services.length === 0) {
      console.log('No hay servicios. Ejecutá primero el seed principal.');
      await client.query('ROLLBACK');
      return;
    }

    // Crear turnos de prueba para hoy y los próximos días
    const today = new Date();
    const turnos = [];

    // Turnos de hoy
    turnos.push({ clientIdx: 0, serviceIdx: 0, daysOffset: 0, time: '09:00' });
    turnos.push({ clientIdx: 1, serviceIdx: 1, daysOffset: 0, time: '10:00' });
    turnos.push({ clientIdx: 2, serviceIdx: 2, daysOffset: 0, time: '14:00' });
    turnos.push({ clientIdx: 3, serviceIdx: 3, daysOffset: 0, time: '15:00' });
    turnos.push({ clientIdx: 4, serviceIdx: 4, daysOffset: 0, time: '16:00' });

    // Turnos de mañana
    turnos.push({ clientIdx: 5, serviceIdx: 5 % services.length, daysOffset: 1, time: '09:00' });
    turnos.push({ clientIdx: 6, serviceIdx: 6 % services.length, daysOffset: 1, time: '10:00' });
    turnos.push({ clientIdx: 7, serviceIdx: 7 % services.length, daysOffset: 1, time: '14:00' });
    turnos.push({ clientIdx: 0, serviceIdx: 8 % services.length, daysOffset: 1, time: '15:00' });

    // Turnos pasados (para ingresos)
    turnos.push({ clientIdx: 1, serviceIdx: 0, daysOffset: -1, time: '09:00', status: 'completed' });
    turnos.push({ clientIdx: 2, serviceIdx: 1, daysOffset: -1, time: '10:00', status: 'completed' });
    turnos.push({ clientIdx: 3, serviceIdx: 2, daysOffset: -2, time: '14:00', status: 'completed' });
    turnos.push({ clientIdx: 4, serviceIdx: 3, daysOffset: -2, time: '15:00', status: 'completed' });
    turnos.push({ clientIdx: 5, serviceIdx: 4, daysOffset: -3, time: '09:00', status: 'completed' });
    turnos.push({ clientIdx: 6, serviceIdx: 5 % services.length, daysOffset: -3, time: '10:00', status: 'completed' });
    turnos.push({ clientIdx: 7, serviceIdx: 6 % services.length, daysOffset: -5, time: '14:00', status: 'completed' });
    turnos.push({ clientIdx: 0, serviceIdx: 7 % services.length, daysOffset: -5, time: '15:00', status: 'completed' });
    turnos.push({ clientIdx: 1, serviceIdx: 8 % services.length, daysOffset: -7, time: '09:00', status: 'completed' });
    turnos.push({ clientIdx: 2, serviceIdx: 9 % services.length, daysOffset: -7, time: '10:00', status: 'completed' });

    // Un turno cancelado
    turnos.push({ clientIdx: 3, serviceIdx: 0, daysOffset: -4, time: '16:00', status: 'cancelled' });

    for (const turno of turnos) {
      const service = services[turno.serviceIdx];
      const date = new Date(today);
      date.setDate(date.getDate() + turno.daysOffset);
      const dateStr = date.toISOString().split('T')[0];

      const startParts = turno.time.split(':');
      const totalMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]) + service.duration_minutes;
      const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
      const endM = (totalMin % 60).toString().padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const status = turno.status || 'confirmed';

      // Verificar que no exista conflicto
      const conflict = await client.query(
        `SELECT id FROM appointments WHERE date = $1 AND start_time = $2 AND status != 'cancelled'`,
        [dateStr, turno.time]
      );

      if (conflict.rows.length === 0) {
        await client.query(
          `INSERT INTO appointments (client_id, service_id, date, start_time, end_time, status, source)
           VALUES ($1, $2, $3, $4, $5, $6, 'manual')`,
          [clientIds[turno.clientIdx], service.id, dateStr, turno.time, endTime, status]
        );
      }
    }

    // Crear productos de prueba
    await client.query(`
      INSERT INTO products (name, description, price, image_url) VALUES
      ('Crema Hidratante Facial', 'Crema hidratante de uso diario con ácido hialurónico y vitamina E. Ideal para pieles secas y mixtas. Textura liviana y absorción rápida.', 18500, null),
      ('Sérum Vitamina C', 'Sérum concentrado con vitamina C pura al 15%. Antioxidante, ilumina y unifica el tono de la piel. Aplicar por las mañanas.', 22000, null),
      ('Protector Solar FPS 50+', 'Protector solar de alta cobertura, oil-free, apto para pieles sensibles. No deja residuo blanco. Uso diario indispensable.', 15000, null),
      ('Agua Micelar Limpiadora', 'Limpiador facial suave que remueve maquillaje e impurezas sin necesidad de enjuague. Con extracto de rosas.', 12000, null),
      ('Contorno de Ojos Anti-age', 'Tratamiento específico para el área periocular. Reduce ojeras, bolsas y líneas de expresión. Con retinol y péptidos.', 25000, null),
      ('Máscara Hidratante Nocturna', 'Mascarilla overnight que repara y nutre la piel mientras dormís. Con ceramidas y manteca de karité.', 19000, null)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✓ Datos de prueba cargados:');
    console.log(`  - ${clientes.length} clientes`);
    console.log(`  - ${turnos.length} turnos (hoy, mañana y pasados)`);
    console.log('  - 6 productos');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en seed de prueba:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData();
