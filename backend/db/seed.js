require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin por defecto
    await client.query(`
      INSERT INTO admins (username, password, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin123', 'Administrador']);

    // Horarios de atención por defecto (Lunes a Viernes, 9:00 a 18:00, slots de 30 min)
    for (let day = 1; day <= 5; day++) {
      await client.query(`
        INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [day, '09:00', '18:00', 30, true]);
    }

    // Sábado, 9:00 a 13:00
    await client.query(`
      INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [6, '09:00', '13:00', 30, true]);

    // Servicios de ejemplo
    const servicios = [
      ['Corte de cabello', 'Corte y peinado básico', 30, 1500.00],
      ['Tintura', 'Coloración completa', 90, 4500.00],
      ['Manicura', 'Limado, cutículas y esmaltado', 45, 2000.00],
      ['Pedicura', 'Cuidado completo de pies', 60, 2500.00],
      ['Limpieza facial', 'Limpieza profunda y tratamiento', 60, 3000.00]
    ];

    for (const [name, description, duration, price] of servicios) {
      await client.query(`
        INSERT INTO services (name, description, duration_minutes, price)
        VALUES ($1, $2, $3, $4)
      `, [name, description, duration, price]);
    }

    await client.query('COMMIT');
    console.log('Seed ejecutado correctamente.');
    console.log('Admin creado: username=admin, password=admin123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en el seed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
