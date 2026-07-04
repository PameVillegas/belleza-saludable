const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// GET /api/admin/schedules - Obtener horarios configurados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM schedules ORDER BY day_of_week, start_time'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener horarios:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PUT /api/admin/schedules - Actualizar horarios (reemplaza todos)
router.put('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { schedules } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Se esperaba un array de horarios.' });
    }

    await client.query('BEGIN');

    // Eliminar horarios existentes
    await client.query('DELETE FROM schedules');

    // Insertar nuevos horarios
    for (const schedule of schedules) {
      const { day_of_week, start_time, end_time, slot_duration_minutes, is_active } = schedule;

      if (day_of_week === undefined || !start_time || !end_time || !slot_duration_minutes) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cada horario requiere day_of_week, start_time, end_time y slot_duration_minutes.' });
      }

      await client.query(
        `INSERT INTO schedules (day_of_week, start_time, end_time, slot_duration_minutes, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [day_of_week, start_time, end_time, slot_duration_minutes, is_active !== false]
      );
    }

    await client.query('COMMIT');

    const result = await pool.query('SELECT * FROM schedules ORDER BY day_of_week, start_time');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar horarios:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// GET /api/admin/schedules/blocked - Listar franjas bloqueadas
router.get('/blocked', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blocked_slots ORDER BY date, start_time'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener bloqueos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/admin/schedules/blocked - Crear bloqueo
router.post('/blocked', authMiddleware, async (req, res) => {
  try {
    const { date, start_time, end_time, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'La fecha es requerida.' });
    }

    const result = await pool.query(
      `INSERT INTO blocked_slots (date, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [date, start_time || null, end_time || null, reason || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear bloqueo:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /api/admin/schedules/blocked/:id - Eliminar bloqueo
router.delete('/blocked/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM blocked_slots WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bloqueo no encontrado.' });
    }

    res.json({ message: 'Bloqueo eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar bloqueo:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
