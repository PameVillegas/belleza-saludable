const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// GET /api/services - Público: solo servicios activos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, duration_minutes, price, image_url FROM services WHERE is_active = true 
       ORDER BY 
         CASE 
           WHEN name ILIKE '%limpieza%' OR name ILIKE '%peeling%' OR name ILIKE '%dermaplaning%' OR name ILIKE '%cabina led%' THEN 1
           WHEN name ILIKE '%microneedling%' OR name ILIKE '%exosomas%' THEN 2
           WHEN name ILIKE '%lifting%' OR name ILIKE '%perfilado%' OR name ILIKE '%laminado%' THEN 3
           WHEN name ILIKE '%ondas%' OR name ILIKE '%presoterapia%' OR name ILIKE '%lipoláser%' OR name ILIKE '%lipolaser%' THEN 4
           WHEN name ILIKE '%depilación%' OR name ILIKE '%depilacion%' THEN 5
           ELSE 3
         END,
         price DESC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener servicios:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/services/:id - Admin: detalle de servicio
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener servicio:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/admin/services - Admin: crear servicio
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, duration_minutes, price, image_url } = req.body;

    if (!name || !duration_minutes || price === undefined) {
      return res.status(400).json({ error: 'Nombre, duración y precio son requeridos.' });
    }

    if (duration_minutes <= 0) {
      return res.status(400).json({ error: 'La duración debe ser mayor a 0.' });
    }

    if (price < 0) {
      return res.status(400).json({ error: 'El precio no puede ser negativo.' });
    }

    const result = await pool.query(
      `INSERT INTO services (name, description, duration_minutes, price, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, duration_minutes, price, image_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear servicio:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PUT /api/admin/services/:id - Admin: editar servicio
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, price, image_url } = req.body;

    if (!name || !duration_minutes || price === undefined) {
      return res.status(400).json({ error: 'Nombre, duración y precio son requeridos.' });
    }

    const result = await pool.query(
      `UPDATE services SET name = $1, description = $2, duration_minutes = $3, price = $4, image_url = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description || null, duration_minutes, price, image_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al editar servicio:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PATCH /api/admin/services/:id/deactivate - Admin: desactivar servicio
router.patch('/:id/deactivate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE services SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al desactivar servicio:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
