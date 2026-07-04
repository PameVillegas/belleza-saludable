require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Limpiar datos anteriores
    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM schedules');
    await client.query('DELETE FROM admins');

    // Admin - Mariana Farias
    await client.query(`
      INSERT INTO admins (username, password, name)
      VALUES ($1, $2, $3)
    `, ['admin', 'admin123', 'Mariana Farias']);

    // Horarios de atención: Lunes a Viernes
    for (let day = 1; day <= 5; day++) {
      await client.query(`
        INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [day, '09:00', '12:00', 60, true]);
      await client.query(`
        INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [day, '14:00', '19:00', 60, true]);
    }

    // Servicios FACIALES
    const faciales = [
      ['Limpieza facial profunda', 'Limpieza facial profunda profesional', 60, 35000],
      ['Limpieza facial profunda + Perfilado de cejas', 'Limpieza profunda combinada con diseño de cejas', 60, 40000],
      ['Limpieza premium', 'Limpieza facial premium con productos de alta gama', 60, 40000],
      ['Peelings químicos', 'Tratamiento de renovación celular con ácidos. Precio base, puede variar según tratamiento', 60, 40000],
      ['Peeling mecánico (Microdermoabrasión/Espátula ultrasónica/Dermaplaning)', 'Exfoliación mecánica profesional. Precio base, puede variar', 60, 40000],
      ['Microneedling / Dermapen', 'Estimulación con microagujas para rejuvenecimiento. Precio base', 60, 40000],
      ['Microneedling (Dermapen + Exosomas y/o activos)', 'Dermapen combinado con exosomas y activos de última generación. Precio base', 60, 40000],
    ];

    // Otros servicios
    const otros = [
      ['Lifting de pestañas', 'Curvado y fijación de pestañas naturales', 60, 25000],
      ['Lifting de pestañas + Perfilado de cejas', 'Combo lifting de pestañas y diseño de cejas', 90, 30000],
      ['Perfilado de cejas', 'Diseño y depilación de cejas', 20, 8000],
      ['Laminado de cejas', 'Alisado y fijación de cejas', 60, 25000],
      ['Laminado de cejas + Perfilado de cejas', 'Combo laminado y perfilado de cejas', 90, 30000],
    ];

    // Servicios corporales
    const corporales = [
      ['Ondas Rusas', 'Electroestimulación muscular para tonificar. Consultar por pack de sesiones', 45, 0],
      ['Ondas Rusas + Presoterapia', 'Combo tonificación y drenaje. Consultar por pack de sesiones', 60, 0],
      ['Lipoláser (por zona)', 'Reducción de adiposidad localizada con láser. Precio por zona', 45, 25000],
      ['Lipoláser + Presoterapia', 'Combo lipoláser y drenaje linfático. Consultar precio', 60, 0],
      ['Lipoláser + Ondas Rusas', 'Combo reducción y tonificación. Consultar precio', 60, 0],
      ['Presoterapia', 'Drenaje linfático mecánico. Consultar por sesiones', 45, 0],
    ];

    // Depilación definitiva
    const depilacion = [
      ['Depilación definitiva', 'Consultar precio por zona y combos disponibles', 30, 0],
    ];

    const todosServicios = [...faciales, ...otros, ...corporales, ...depilacion];

    for (const [name, description, duration, price] of todosServicios) {
      await client.query(`
        INSERT INTO services (name, description, duration_minutes, price)
        VALUES ($1, $2, $3, $4)
      `, [name, description, duration, price]);
    }

    await client.query('COMMIT');
    console.log('Seed ejecutado correctamente.');
    console.log('Admin creado: username=admin, password=admin123');
    console.log('Horarios: Lunes a Viernes, 9-12 y 14-19');
    console.log(`Servicios creados: ${todosServicios.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en el seed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
