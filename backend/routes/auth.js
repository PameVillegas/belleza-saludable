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

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente.' });
});

module.exports = router;
