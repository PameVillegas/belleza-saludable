const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos
  message: { error: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.' }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos.' });
    }

    const result = await pool.query(
      'SELECT id, username, name FROM admins WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const admin = result.rows[0];
    res.json({
      message: 'Login exitoso',
      admin: { id: admin.id, username: admin.username, name: admin.name }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/register - Registrar nuevo admin
router.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password y nombre son requeridos.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El username debe tener al menos 3 caracteres.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    // Verificar si ya existe
    const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
    }

    const result = await pool.query(
      'INSERT INTO admins (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name',
      [username, password, name]
    );

    res.status(201).json({
      message: 'Registro exitoso. Ya podés iniciar sesión.',
      admin: result.rows[0]
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/auth/admins - Listar todos los admins (con contraseñas)
router.get('/admins', async (req, res) => {
  try {
    const username = req.headers['x-admin-username'];
    if (!username) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const result = await pool.query(
      'SELECT id, username, password, name, created_at FROM admins ORDER BY created_at'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar admins:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PUT /api/auth/admins/:id - Editar admin
router.put('/admins/:id', async (req, res) => {
  try {
    const username = req.headers['x-admin-username'];
    if (!username) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const { id } = req.params;
    const { username: newUsername, password, name } = req.body;

    if (!newUsername || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    // Verificar duplicados excluyendo el actual
    const existing = await pool.query('SELECT id FROM admins WHERE username = $1 AND id != $2', [newUsername, id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
    }

    const result = await pool.query(
      'UPDATE admins SET username = $1, password = $2, name = $3 WHERE id = $4 RETURNING id, username, name',
      [newUsername, password, name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al editar admin:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /api/auth/admins/:id - Eliminar admin
router.delete('/admins/:id', async (req, res) => {
  try {
    const username = req.headers['x-admin-username'];
    if (!username) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const { id } = req.params;

    // No permitir eliminarse a sí mismo
    const self = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (self.rows.length > 0 && self.rows[0].id === id) {
      return res.status(400).json({ error: 'No podés eliminar tu propia cuenta.' });
    }

    // Verificar que quede al menos un admin
    const count = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Debe existir al menos un administrador.' });
    }

    const result = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin no encontrado.' });
    }

    res.json({ message: 'Administrador eliminado.' });
  } catch (err) {
    console.error('Error al eliminar admin:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente.' });
});

// === AUTH DE CLIENTES ===

// POST /api/auth/client/register - Registro de cliente
router.post('/client/register', async (req, res) => {
  try {
    const { name, phone, email, username, password } = req.body;

    if (!name || !phone || !email || !username || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: nombre, teléfono, email, usuario y contraseña.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    // Verificar si el username ya existe
    const existingUser = await pool.query('SELECT id FROM clients WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
    }

    // Verificar si email o phone ya existen
    const existingContact = await pool.query('SELECT id FROM clients WHERE email = $1 OR phone = $2', [email, phone]);
    if (existingContact.rows.length > 0) {
      // Actualizar el cliente existente con username/password
      const result = await pool.query(
        'UPDATE clients SET username = $1, password = $2, name = $3 WHERE email = $4 OR phone = $5 RETURNING id, name, username, phone, email',
        [username, password, name, email, phone]
      );
      return res.status(201).json({ message: 'Cuenta creada exitosamente.', client: result.rows[0] });
    }

    const result = await pool.query(
      'INSERT INTO clients (name, phone, email, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, phone, email',
      [name, phone, email, username, password]
    );

    res.status(201).json({ message: 'Cuenta creada exitosamente.', client: result.rows[0] });
  } catch (err) {
    console.error('Error en registro de cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/client/login - Login de cliente
router.post('/client/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    const result = await pool.query(
      'SELECT id, name, username, phone, email FROM clients WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    res.json({ message: 'Login exitoso', client: result.rows[0] });
  } catch (err) {
    console.error('Error en login de cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/auth/client/users - Admin: listar clientes con contraseñas
router.get('/client/users', async (req, res) => {
  try {
    const adminUser = req.headers['x-admin-username'];
    if (!adminUser) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const result = await pool.query(
      'SELECT id, name, phone, email, username, password, created_at FROM clients WHERE username IS NOT NULL ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar usuarios clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
