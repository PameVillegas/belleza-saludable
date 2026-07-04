const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// GET /api/admin/income - Resumen de ingresos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Ingresos del día
    const dayResult = await pool.query(
      `SELECT COALESCE(SUM(s.price), 0) as total, COUNT(*) as count
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date = $1 AND a.status IN ('confirmed', 'completed')`,
      [today]
    );

    // Ingresos del mes
    const monthResult = await pool.query(
      `SELECT COALESCE(SUM(s.price), 0) as total, COUNT(*) as count
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date >= $1 AND a.status IN ('confirmed', 'completed')`,
      [firstDayOfMonth]
    );

    res.json({
      today: {
        total: Number(dayResult.rows[0].total),
        count: Number(dayResult.rows[0].count)
      },
      month: {
        total: Number(monthResult.rows[0].total),
        count: Number(monthResult.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Error al obtener ingresos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/income/search - Búsqueda de ingresos por rango de fechas
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'Se requieren fechas "from" y "to".' });
    }

    const result = await pool.query(
      `SELECT a.date, a.start_time, c.name as client_name, s.name as service_name, s.price,
              a.status
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN clients c ON a.client_id = c.id
       WHERE a.date >= $1 AND a.date <= $2 AND a.status IN ('confirmed', 'completed')
       ORDER BY a.date DESC, a.start_time DESC`,
      [from, to]
    );

    // Total del rango
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(s.price), 0) as total, COUNT(*) as count
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date >= $1 AND a.date <= $2 AND a.status IN ('confirmed', 'completed')`,
      [from, to]
    );

    res.json({
      appointments: result.rows,
      total: Number(totalResult.rows[0].total),
      count: Number(totalResult.rows[0].count)
    });
  } catch (err) {
    console.error('Error al buscar ingresos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
