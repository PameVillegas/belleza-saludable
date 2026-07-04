const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// GET /api/reviews - Público: reseñas aprobadas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, client_name, service_name, stars, text, created_at
       FROM reviews
       WHERE is_approved = true
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener reseñas:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/reviews - Público: crear reseña (cliente logueado)
router.post('/', async (req, res) => {
  try {
    const { client_name, service_name, stars, text } = req.body;

    if (!client_name || !stars || !text) {
      return res.status(400).json({ error: 'Nombre, estrellas y texto son requeridos.' });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Las estrellas deben ser entre 1 y 5.' });
    }

    if (text.length < 10) {
      return res.status(400).json({ error: 'La reseña debe tener al menos 10 caracteres.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (client_name, service_name, stars, text, is_approved)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [client_name, service_name || null, stars, text]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear reseña:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/reviews - Admin: todas las reseñas
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener reseñas:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PATCH /api/admin/reviews/:id/toggle - Admin: aprobar/desaprobar reseña
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE reviews SET is_approved = NOT is_approved WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al modificar reseña:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /api/admin/reviews/:id - Admin: eliminar reseña
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    res.json({ message: 'Reseña eliminada.' });
  } catch (err) {
    console.error('Error al eliminar reseña:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
