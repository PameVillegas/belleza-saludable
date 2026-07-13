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
           WHEN name ILIKE '%limpieza facial profunda' AND name NOT ILIKE '%perfilado%' AND name NOT ILIKE '%premium%' THEN 1
           WHEN name ILIKE '%limpieza premium%' THEN 2
           WHEN name ILIKE '%limpieza%' AND name ILIKE '%perfilado%' THEN 3
           WHEN name ILIKE '%peeling mecánico%' OR name ILIKE '%microdermoabrasión%' THEN 4
           WHEN name ILIKE '%dermaplaning%' THEN 5
           WHEN name ILIKE '%peelings químicos' AND name NOT ILIKE '%microneedling%' AND name NOT ILIKE '%dermapen%' THEN 6
           WHEN name ILIKE '%peeling químico técnica%' OR name ILIKE '%layering%' THEN 7
           WHEN name ILIKE '%cabina led%' THEN 8
           WHEN name ILIKE '%microneedling%' AND name NOT ILIKE '%exosomas%' AND name NOT ILIKE '%peeling%' THEN 9
           WHEN name ILIKE '%microneedling con exosomas%' AND name NOT ILIKE '%peeling%' THEN 10
           WHEN name ILIKE '%peeling%' AND name ILIKE '%microneedling%' AND name ILIKE '%exosomas%' THEN 11
           WHEN name ILIKE 'perfilado de cejas' THEN 12
           WHEN name ILIKE 'lifting de pestañas' AND name NOT ILIKE '%perfilado%' THEN 13
           WHEN name ILIKE '%lifting%' AND name ILIKE '%perfilado%' THEN 14
           WHEN name ILIKE 'laminado de cejas' AND name NOT ILIKE '%perfilado%' THEN 15
           WHEN name ILIKE '%laminado%' AND name ILIKE '%perfilado%' THEN 16
           WHEN name ILIKE 'ondas rusas' AND name NOT ILIKE '%preso%' AND name NOT ILIKE '%lipo%' THEN 17
           WHEN name ILIKE 'lipoláser%' AND name NOT ILIKE '%preso%' AND name NOT ILIKE '%ondas%' THEN 18
           WHEN name ILIKE 'presoterapia' AND name NOT ILIKE '%lipo%' AND name NOT ILIKE '%ondas%' THEN 19
           WHEN name ILIKE '%ondas%' AND (name ILIKE '%preso%' OR name ILIKE '%lipo%') THEN 20
           WHEN name ILIKE '%lipoláser%' AND name ILIKE '%preso%' THEN 21
           WHEN name ILIKE '%depilación%' OR name ILIKE '%depilacion%' THEN 22
           ELSE 11
         END`
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

// DELETE /api/admin/services/:id - Admin: eliminar servicio
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM appointments WHERE service_id = $1', [id]);
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    res.json({ message: 'Servicio eliminado.' });
  } catch (err) {
    console.error('Error al eliminar servicio:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
