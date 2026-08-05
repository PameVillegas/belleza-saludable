'use strict';

/**
 * Unit tests for availability calculation logic.
 *
 * Covers:
 *  1. calculateEndTime  — adds duration to a start time
 *  2. getGabinete       — maps service names to gabinete categories
 *  3. generateSlots     — builds consecutive time slots within a schedule block
 *  4. Business-hours validation — slots respect working-hours ranges
 */

const {
  calculateEndTime,
  getGabinete,
  generateSlots,
  timeToMinutes,
  minutesToTime,
  timeOverlaps,
} = require('../utils/availabilityHelpers');

// ---------------------------------------------------------------------------
// calculateEndTime
// ---------------------------------------------------------------------------
describe('calculateEndTime', () => {
  test('caso normal — suma 60 minutos a 09:00 → 10:00', () => {
    expect(calculateEndTime('09:00', 60)).toBe('10:00');
  });

  test('suma 30 minutos a 09:30 → 10:00', () => {
    expect(calculateEndTime('09:30', 30)).toBe('10:00');
  });

  test('suma 90 minutos a 14:00 → 15:30', () => {
    expect(calculateEndTime('14:00', 90)).toBe('15:30');
  });

  test('duración cero — no cambia la hora', () => {
    expect(calculateEndTime('11:00', 0)).toBe('11:00');
  });

  test('cruce de medianoche — 23:30 + 60 min → 00:30', () => {
    expect(calculateEndTime('23:30', 60)).toBe('00:30');
  });

  test('cruce de medianoche — 23:00 + 90 min → 00:30', () => {
    expect(calculateEndTime('23:00', 90)).toBe('00:30');
  });

  test('exactamente medianoche — 23:00 + 60 min → 00:00', () => {
    expect(calculateEndTime('23:00', 60)).toBe('00:00');
  });

  test('suma 45 minutos a 18:15 → 19:00', () => {
    expect(calculateEndTime('18:15', 45)).toBe('19:00');
  });
});

// ---------------------------------------------------------------------------
// getGabinete
// ---------------------------------------------------------------------------
describe('getGabinete', () => {
  // --- Faciales (gabinete 1) ---
  test('tratamiento facial → facial', () => {
    expect(getGabinete('Tratamiento Facial Hidratante')).toBe('facial');
  });

  test('limpieza facial → facial', () => {
    expect(getGabinete('Limpieza Facial Profunda')).toBe('facial');
  });

  test('diseño de cejas → facial', () => {
    expect(getGabinete('Diseño de Cejas')).toBe('facial');
  });

  test('mirada express → facial', () => {
    expect(getGabinete('Mirada Express')).toBe('facial');
  });

  // --- Depilación (también gabinete 1) ---
  test('depilación láser → facial', () => {
    expect(getGabinete('Depilación Láser Definitiva')).toBe('facial');
  });

  test('depilación definitiva → facial', () => {
    expect(getGabinete('Depilación Definitiva Axilas')).toBe('facial');
  });

  // --- Corporales (gabinete 2) ---
  test('ondas rusas → corporal', () => {
    expect(getGabinete('Ondas Rusas')).toBe('corporal');
  });

  test('ondas rusas en minúsculas → corporal', () => {
    expect(getGabinete('tratamiento de ondas rusas')).toBe('corporal');
  });

  test('presoterapia → corporal', () => {
    expect(getGabinete('Presoterapia')).toBe('corporal');
  });

  test('presoterapia combinada → corporal', () => {
    expect(getGabinete('Sesión de Presoterapia + Drenaje')).toBe('corporal');
  });

  test('lipoláser → corporal', () => {
    expect(getGabinete('Lipoláser')).toBe('corporal');
  });

  test('lipolaser (sin tilde) → corporal', () => {
    expect(getGabinete('Lipolaser Abdominal')).toBe('corporal');
  });

  test('servicio desconocido → facial (fallback)', () => {
    expect(getGabinete('Masaje Relajante')).toBe('facial');
  });
});

// ---------------------------------------------------------------------------
// generateSlots
// ---------------------------------------------------------------------------
describe('generateSlots', () => {
  test('bloque 09:00–12:00 con duración 60 min → 3 franjas', () => {
    const slots = generateSlots('09:00', '12:00', 60);
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ start: '09:00', end: '10:00' });
    expect(slots[1]).toEqual({ start: '10:00', end: '11:00' });
    expect(slots[2]).toEqual({ start: '11:00', end: '12:00' });
  });

  test('bloque 14:00–19:00 con duración 60 min → 5 franjas', () => {
    const slots = generateSlots('14:00', '19:00', 60);
    expect(slots).toHaveLength(5);
    expect(slots[0]).toEqual({ start: '14:00', end: '15:00' });
    expect(slots[4]).toEqual({ start: '18:00', end: '19:00' });
  });

  test('bloque 09:00–12:00 con duración 90 min → 2 franjas', () => {
    const slots = generateSlots('09:00', '12:00', 90);
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ start: '09:00', end: '10:30' });
    expect(slots[1]).toEqual({ start: '10:30', end: '12:00' });
  });

  test('duración no cabe en absoluto → sin franjas', () => {
    // 09:00–09:30 con duración 60 min → no hay lugar
    const slots = generateSlots('09:00', '09:30', 60);
    expect(slots).toHaveLength(0);
  });

  test('bloque sin tiempo (igual inicio y fin) → sin franjas', () => {
    const slots = generateSlots('10:00', '10:00', 30);
    expect(slots).toHaveLength(0);
  });

  test('bloque de 30 min con duración 30 → exactamente 1 franja', () => {
    const slots = generateSlots('10:00', '10:30', 30);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: '10:00', end: '10:30' });
  });

  test('bloque 14:00–19:00 con duración 30 min → 10 franjas', () => {
    const slots = generateSlots('14:00', '19:00', 30);
    expect(slots).toHaveLength(10);
  });

  test('franja residual no genera slot extra — 09:00–11:30 con 60 min → 2 franjas', () => {
    // 09:00–10:00, 10:00–11:00. Los 30 minutos restantes no alcanzan.
    const slots = generateSlots('09:00', '11:30', 60);
    expect(slots).toHaveLength(2);
    expect(slots[1]).toEqual({ start: '10:00', end: '11:00' });
  });

  test('horario vacío (schedules = []) → sin franjas al concatenar', () => {
    // Simula el comportamiento del endpoint cuando no hay schedules para el día
    const schedules = [];
    let slots = [];
    for (const schedule of schedules) {
      slots = slots.concat(generateSlots(schedule.start_time, schedule.end_time, 60));
    }
    expect(slots).toHaveLength(0);
  });

  test('dos bloques horarios (mañana y tarde) generan franjas combinadas correctamente', () => {
    const morning = generateSlots('09:00', '12:00', 60); // 3 franjas
    const afternoon = generateSlots('14:00', '18:00', 60); // 4 franjas
    const combined = morning.concat(afternoon);
    expect(combined).toHaveLength(7);
    expect(combined[0]).toEqual({ start: '09:00', end: '10:00' });
    expect(combined[3]).toEqual({ start: '14:00', end: '15:00' });
    expect(combined[6]).toEqual({ start: '17:00', end: '18:00' });
  });
});

// ---------------------------------------------------------------------------
// Business hours validation (via timeOverlaps + generateSlots)
// ---------------------------------------------------------------------------
describe('validación de horarios de atención', () => {
  test('una franja generada está siempre dentro del bloque horario', () => {
    const scheduleStart = '09:00';
    const scheduleEnd = '12:00';
    const slots = generateSlots(scheduleStart, scheduleEnd, 60);
    slots.forEach(slot => {
      expect(timeToMinutes(slot.start)).toBeGreaterThanOrEqual(timeToMinutes(scheduleStart));
      expect(timeToMinutes(slot.end)).toBeLessThanOrEqual(timeToMinutes(scheduleEnd));
    });
  });

  test('timeOverlaps detecta solapamiento real', () => {
    // 09:00–10:00 y 09:30–10:30 se solapan
    expect(timeOverlaps('09:00', '10:00', '09:30', '10:30')).toBe(true);
  });

  test('timeOverlaps no marca solapamiento cuando los rangos son contiguos', () => {
    // 09:00–10:00 y 10:00–11:00 son contiguos, no se solapan
    expect(timeOverlaps('09:00', '10:00', '10:00', '11:00')).toBe(false);
  });

  test('timeOverlaps no marca solapamiento cuando los rangos no se tocan', () => {
    // 09:00–10:00 y 11:00–12:00 no se solapan
    expect(timeOverlaps('09:00', '10:00', '11:00', '12:00')).toBe(false);
  });

  test('slot bloqueado es filtrado correctamente del listado disponible', () => {
    const slots = generateSlots('09:00', '12:00', 60);
    const blockedStart = '10:00';
    const blockedEnd = '11:00';

    const available = slots.filter(
      slot => !timeOverlaps(slot.start, slot.end, blockedStart, blockedEnd)
    );

    expect(available).toHaveLength(2);
    expect(available.find(s => s.start === '10:00')).toBeUndefined();
  });

  test('slot de turno existente del mismo gabinete bloquea la franja', () => {
    const slots = generateSlots('09:00', '12:00', 60);
    const existingAppt = { start_time: '09:00', end_time: '10:00' };

    const available = slots.filter(
      slot => !timeOverlaps(slot.start, slot.end, existingAppt.start_time, existingAppt.end_time)
    );

    expect(available).toHaveLength(2);
    expect(available.find(s => s.start === '09:00')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// timeToMinutes / minutesToTime (helpers internos)
// ---------------------------------------------------------------------------
describe('timeToMinutes y minutesToTime', () => {
  test('timeToMinutes convierte correctamente', () => {
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  test('minutesToTime convierte correctamente', () => {
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  test('ida y vuelta: timeToMinutes → minutesToTime mantiene el valor', () => {
    const times = ['09:00', '14:30', '18:45', '23:00'];
    times.forEach(t => {
      expect(minutesToTime(timeToMinutes(t))).toBe(t);
    });
  });
});
