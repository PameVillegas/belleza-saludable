const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/availability/:serviceId - Fechas disponibles para un servicio (próximos 30 días)
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Verificar que el servicio existe y está activo
    const serviceResult = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = true',
      [serviceId]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado o inactivo.' });
    }

    // Obtener horarios de atención activos
    const schedulesResult = await pool.query(
      'SELECT * FROM schedules WHERE is_active = true'
    );

    const schedules = schedulesResult.rows;
    const availableDates = [];
    const today = new Date();

    // Verificar próximos 30 días
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();

      // Verificar si hay horario para este día
      const hasSchedule = schedules.some(s => s.day_of_week === dayOfWeek);
      if (!hasSchedule) continue;

      // Verificar si el día completo está bloqueado
      const dateStr = date.toISOString().split('T')[0];
      const blockResult = await pool.query(
        `SELECT id FROM blocked_slots
         WHERE date = $1 AND start_time IS NULL AND end_time IS NULL`,
        [dateStr]
      );

      if (blockResult.rows.length === 0) {
        availableDates.push(dateStr);
      }
    }

    res.json({ serviceId, dates: availableDates });
  } catch (err) {
    console.error('Error al obtener disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/availability/:serviceId/:date - Franjas horarias disponibles
router.get('/:serviceId/:date', async (req, res) => {
  try {
    const { serviceId, date } = req.params;

    // Obtener servicio
    const serviceResult = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = true',
      [serviceId]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado o inactivo.' });
    }

    const service = serviceResult.rows[0];
    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    // Obtener horario para ese día
    const scheduleResult = await pool.query(
      'SELECT * FROM schedules WHERE day_of_week = $1 AND is_active = true',
      [dayOfWeek]
    );

    if (scheduleResult.rows.length === 0) {
      return res.json({ serviceId, date, slots: [] });
    }

    const schedule = scheduleResult.rows[0];

    // Generar todas las franjas posibles
    const slots = generateSlots(
      schedule.start_time,
      schedule.end_time,
      service.duration_minutes
    );

    // Obtener turnos existentes para esa fecha (no cancelados)
    const appointmentsResult = await pool.query(
      `SELECT start_time, end_time FROM appointments
       WHERE date = $1 AND status != 'cancelled'`,
      [date]
    );

    // Obtener bloqueos para esa fecha
    const blockedResult = await pool.query(
      'SELECT start_time, end_time FROM blocked_slots WHERE date = $1',
      [date]
    );

    // Filtrar franjas ocupadas
    const existingAppointments = appointmentsResult.rows;
    const blockedSlots = blockedResult.rows;

    const availableSlots = slots.filter(slot => {
      // Verificar conflictos con turnos existentes
      const conflictsWithAppointment = existingAppointments.some(appt =>
        timeOverlaps(slot.start, slot.end, appt.start_time, appt.end_time)
      );

      // Verificar conflictos con bloqueos
      const conflictsWithBlock = blockedSlots.some(block => {
        if (!block.start_time) return true; // Bloqueo de día completo
        return timeOverlaps(slot.start, slot.end, block.start_time, block.end_time);
      });

      return !conflictsWithAppointment && !conflictsWithBlock;
    });

    res.json({ serviceId, date, slots: availableSlots });
  } catch (err) {
    console.error('Error al obtener franjas:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Generar franjas de tiempo
function generateSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + durationMinutes <= end) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + durationMinutes)
    });
    current += durationMinutes;
  }

  return slots;
}

// Detectar solapamiento de rangos horarios
function timeOverlaps(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

// Convertir TIME string a minutos
function timeToMinutes(timeStr) {
  const str = typeof timeStr === 'string' ? timeStr : timeStr.toString();
  const parts = str.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Convertir minutos a TIME string
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = router;
