require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM schedules');
    await client.query('DELETE FROM admins');

    // Admin
    await client.query(`INSERT INTO admins (username, password, name) VALUES ($1, $2, $3)`, ['admin', 'admin123', 'Mariana Farias']);

    // Horarios: Lunes a Viernes, mañana y tarde
    for (let day = 1; day <= 5; day++) {
      await client.query(`INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES ($1, $2, $3, $4, $5)`, [day, '09:00', '12:00', 60, true]);
      await client.query(`INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES ($1, $2, $3, $4, $5)`, [day, '14:00', '19:00', 60, true]);
    }

    const servicios = [
      // FACIALES
      ['Limpieza Facial Profunda', 'Protocolo de higiene integral que incluye desincrustación de impurezas, extracción de comedones y recuperación del manto hidrolipídico. Ideal para oxigenar los tejidos y devolver la luminosidad natural.', 60, 35000],
      ['Limpieza Facial Profunda + Perfilado de Cejas', 'El cuidado clínico de la piel se combina con el diseño de la mirada, logrando un rostro renovado y armónico en una sola sesión.', 60, 40000],
      ['Limpieza Premium', 'Una experiencia potenciada con activos de alta gama y máscaras específicas según el biotipo cutáneo, enfocada en una hidratación profunda y efecto revitalizante inmediato. Combinado con cabina LED.', 60, 40000],
      ['Peelings Químicos', 'Exfoliación química controlada mediante el uso de ácidos (AHA/BHA) para tratar hiperpigmentaciones, secuelas de acné y fotoenvejecimiento, estimulando la renovación celular desde las capas más profundas. Precio base.', 60, 40000],
      ['Peeling Mecánico (Microdermoabrasión/Espátula Ultrasónica/Dermaplaning)', 'Remoción mecánica del estrato córneo para suavizar irregularidades, mejorar la permeabilidad cutánea y lograr una textura de porcelana. Precio base.', 60, 40000],
      ['Microneedling / Dermapen', 'Terapia de inducción de colágeno mediante microperforaciones que estimulan los mecanismos naturales de reparación de la piel, tratando arrugas finas, poros dilatados y flacidez. Precio base.', 60, 40000],
      ['Microneedling con Exosomas y Activos', 'Biotecnología avanzada aplicada a la estética. Utilizamos exosomas y principios activos específicos (como PDRN) para una regeneración celular acelerada y una reparación dérmica de última generación. Precio base.', 60, 40000],
      ['Peeling Químico + Microneedling con Exosomas', 'Protocolo de rejuvenecimiento global y corrección profunda. Peeling químico adaptado seguido de Microneedling con exosomas para potenciar la regeneración celular, síntesis de colágeno y reparación dérmica. Precio base.', 60, 40000],
      ['Cabina LED Facial', 'Terapia de fotobiomodulación con diferentes longitudes de onda. Roja para rejuvenecimiento, Azul para acné, Verde para manchas. Reduce inflamación, acelera reparación tisular y potencia síntesis de colágeno y elastina.', 30, 30000],
      // MIRADA Y DISEÑO
      ['Lifting de Pestañas', 'Técnica de curvado desde la raíz que acentúa la longitud y dirección de tus pestañas naturales, con un efecto de apertura de mirada que dura semanas.', 60, 25000],
      ['Lifting de Pestañas + Perfilado de Cejas', 'El combo ideal para definir tu mirada de forma natural y elegante, ajustando la forma de tus cejas a tu morfología facial.', 75, 30000],
      ['Perfilado de Cejas', 'Diseño personalizado basado en visagismo para resaltar tus facciones y dar marco al rostro.', 20, 8000],
      ['Laminado de Cejas', 'Procedimiento para direccionar y disciplinar los vellos de las cejas, logrando un aspecto más poblado, definido y prolijo.', 60, 25000],
      ['Laminado de Cejas + Perfilado', 'Máxima definición y volumen para tus cejas, combinando técnica de fijación y diseño manual.', 75, 30000],
      // CORPORALES
      ['Ondas Rusas', 'Electroestimulación de alta intensidad que trabaja sobre las fibras musculares para combatir la flacidez, mejorar el tono y favorecer el retorno venoso. Consultar precio por pack.', 30, 0],
      ['Ondas Rusas + Presoterapia', 'Sinergia perfecta para tonificar y favorecer la eliminación de toxinas y líquidos retenidos mediante el drenaje linfático mecánico. Consultar precio.', 60, 0],
      ['Lipoláser (por zona)', 'Técnica de láser diodo de baja intensidad que promueve la lipólisis en zonas críticas de forma segura y sin dolor.', 30, 25000],
      ['Lipoláser + Presoterapia', 'Combina la degradación de lípidos con un drenaje inmediato para acelerar la eliminación de la adiposidad tratada y mejorar la circulación. Consultar precio.', 60, 0],
      ['Lipoláser + Ondas Rusas', 'Tratamiento de choque que ataca la grasa localizada y refuerza la estructura muscular de la zona al mismo tiempo. Consultar precio.', 60, 0],
      ['Presoterapia', 'Masaje neumático que estimula el sistema linfático, ideal para piernas cansadas, reducción de edemas y mejora de la celulitis. Consultar precio.', 45, 0],
      // DEPILACIÓN
      ['Depilación Definitiva', 'Tecnología de vanguardia para la eliminación progresiva del vello, garantizando una piel suave y libre de foliculitis. Consultá por promos en zonas combinadas.', 30, 0],
    ];

    for (const [name, description, duration, price] of servicios) {
      await client.query(`INSERT INTO services (name, description, duration_minutes, price) VALUES ($1, $2, $3, $4)`, [name, description, duration, price]);
    }

    await client.query('COMMIT');
    console.log('Seed ejecutado correctamente.');
    console.log('Admin creado: username=admin, password=admin123');
    console.log('Horarios: Lunes a Viernes, 9-12 y 14-19');
    console.log(`Servicios creados: ${servicios.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en el seed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
