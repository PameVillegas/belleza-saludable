require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Migración ejecutada correctamente.');
  } catch (err) {
    console.error('Error en la migración:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
