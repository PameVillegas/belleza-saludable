const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// Todas las rutas de clientes requieren autenticación
router.use(authMiddleware);

// GET /api/admin/clients - Listar clientes (con búsqueda opcional)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM clients';
    let params = [];

    if (search) {
      query += ` WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1`;
      params = [`%${search}%`];
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/clients/:id - Detalle de cliente con historial
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const appointmentsResult = await pool.query(
      `SELECT a.*, s.name as service_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.client_id = $1
       ORDER BY a.date DESC, a.start_time DESC`,
      [id]
    );

    res.json({
      ...clientResult.rows[0],
      appointments: appointmentsResult.rows
    });
  } catch (err) {
    console.error('Error al obtener cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/admin/clients - Crear cliente
router.post('/', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Nombre, teléfono y email son requeridos.' });
    }

    // Verificar si ya existe por email o teléfono
    const existing = await pool.query(
      'SELECT id FROM clients WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya existe un cliente con ese email o teléfono.',
        existingId: existing.rows[0].id
      });
    }

    const result = await pool.query(
      `INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3) RETURNING *`,
      [name, phone, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PUT /api/admin/clients/:id - Editar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Nombre, teléfono y email son requeridos.' });
    }

    // Verificar duplicados excluyendo el cliente actual
    const existing = await pool.query(
      'SELECT id FROM clients WHERE (email = $1 OR phone = $2) AND id != $3',
      [email, phone, id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe otro cliente con ese email o teléfono.' });
    }

    const result = await pool.query(
      `UPDATE clients SET name = $1, phone = $2, email = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, phone, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al editar cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
