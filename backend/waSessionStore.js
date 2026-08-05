const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');
const pool = require('./db/pool');

const TABLE = 'wa_sessions';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_sessions (
      name VARCHAR(255) PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function readData(name) {
  const res = await pool.query('SELECT data FROM wa_sessions WHERE name = $1', [name]);
  if (res.rows.length === 0) return null;
  return JSON.parse(res.rows[0].data, BufferJSON.reviver);
}

async function writeData(name, value) {
  if (!value) {
    await pool.query('DELETE FROM wa_sessions WHERE name = $1', [name]);
    return;
  }
  await pool.query(
    `INSERT INTO wa_sessions (name, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [name, JSON.stringify(value, BufferJSON.replacer)]
  );
}

async function clearAll() {
  await pool.query('DELETE FROM wa_sessions');
}

async function useDBAuthState() {
  await ensureTable();
  const creds = (await readData('creds.json')) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(ids.map(async (id) => {
            let value = await readData(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }));
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const name = `${category}-${id}`;
              tasks.push(value ? writeData(name, value) : writeData(name, null));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => writeData('creds.json', creds)
  };
}

module.exports = { useDBAuthState, ensureTable, clearAll };
