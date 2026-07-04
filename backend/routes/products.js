const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// GET /api/products - Público: productos activos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price, image_url FROM products WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/products - Admin: todos los productos
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/admin/products - Admin: crear producto
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos.' });
    }

    if (price < 0) {
      return res.status(400).json({ error: 'El precio no puede ser negativo.' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, price, image_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PUT /api/admin/products/:id - Admin: editar producto
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos.' });
    }

    const result = await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, description || null, price, image_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al editar producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PATCH /api/admin/products/:id/deactivate - Admin: desactivar producto
router.patch('/:id/deactivate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al desactivar producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /api/admin/products/:id - Admin: eliminar producto
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json({ message: 'Producto eliminado.' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
