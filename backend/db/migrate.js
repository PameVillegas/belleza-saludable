require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);

    // Agregar columnas username/password a clients si no existen
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='username') THEN
          ALTER TABLE clients ADD COLUMN username VARCHAR(100) UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='password') THEN
          ALTER TABLE clients ADD COLUMN password VARCHAR(255);
        END IF;
      END $$;
    `);

    console.log('Migración ejecutada correctamente.');
  } catch (err) {
    console.error('Error en la migración:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
