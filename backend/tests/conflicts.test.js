'use strict';

/**
 * Unit tests for appointment conflict detection.
 *
 * Tests the gabinete-aware conflict logic: two appointments conflict only if
 * they belong to the same gabinete AND their time ranges overlap.
 */

const { timeOverlaps, getGabinete } = require('../utils/availabilityHelpers');

// ---------------------------------------------------------------------------
// Helper: simulate the conflict check used in appointments.js
// ---------------------------------------------------------------------------
/**
 * Given a new appointment proposal and a list of existing appointments,
 * returns true if there is a conflict (same gabinete + time overlap).
 * Excludes a specific appointment id (for edit scenarios).
 *
 * @param {{ start: string, end: string, serviceName: string }} proposal
 * @param {{ id: string, start_time: string, end_time: string, service_name: string, status: string }[]} existing
 * @param {string|null} excludeId - appointment id to exclude (self-exclusion on edit)
 * @returns {boolean}
 */
function hasConflict(proposal, existing, excludeId = null) {
  const proposalGabinete = getGabinete(proposal.serviceName);

  return existing.some(appt => {
    if (appt.status === 'cancelled') return false;
    if (excludeId && appt.id === excludeId) return false;
    if (getGabinete(appt.service_name) !== proposalGabinete) return false;
    return timeOverlaps(proposal.start, proposal.end, appt.start_time, appt.end_time);
  });
}

// ---------------------------------------------------------------------------
// timeOverlaps — core overlap logic
// ---------------------------------------------------------------------------
describe('timeOverlaps — detección de solapamiento básico', () => {
  test('solapamiento completo: A contiene a B', () => {
    expect(timeOverlaps('09:00', '11:00', '09:30', '10:30')).toBe(true);
  });

  test('solapamiento parcial: A empieza antes y termina dentro de B', () => {
    expect(timeOverlaps('09:00', '10:30', '10:00', '11:00')).toBe(true);
  });

  test('solapamiento parcial: B empieza antes y termina dentro de A', () => {
    expect(timeOverlaps('10:00', '11:00', '09:30', '10:30')).toBe(true);
  });

  test('turnos contiguos — no hay solapamiento (A termina cuando B empieza)', () => {
    expect(timeOverlaps('09:00', '10:00', '10:00', '11:00')).toBe(false);
  });

  test('sin solapamiento — A termina antes de que B empiece', () => {
    expect(timeOverlaps('09:00', '10:00', '11:00', '12:00')).toBe(false);
  });

  test('sin solapamiento — B termina antes de que A empiece', () => {
    expect(timeOverlaps('11:00', '12:00', '09:00', '10:00')).toBe(false);
  });

  test('mismo horario exacto — solapamiento total', () => {
    expect(timeOverlaps('09:00', '10:00', '09:00', '10:00')).toBe(true);
  });

  test('turno de duración cero al inicio del otro — no solapa (contiguos)', () => {
    // Zero-duration: start === end
    expect(timeOverlaps('09:00', '09:00', '09:00', '10:00')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasConflict — gabinete-aware conflict check
// ---------------------------------------------------------------------------
describe('hasConflict — detección con conciencia de gabinete', () => {
  const existing = [
    {
      id: 'appt-1',
      start_time: '09:00',
      end_time: '10:00',
      service_name: 'Limpieza Facial Profunda',
      status: 'confirmed',
    },
    {
      id: 'appt-2',
      start_time: '09:00',
      end_time: '10:00',
      service_name: 'Ondas Rusas',
      status: 'confirmed',
    },
  ];

  test('facial vs facial con solapamiento → conflicto', () => {
    const proposal = { start: '09:30', end: '10:30', serviceName: 'Peelings Químicos' };
    expect(hasConflict(proposal, existing)).toBe(true);
  });

  test('corporal vs corporal con solapamiento → conflicto', () => {
    const proposal = { start: '09:30', end: '10:30', serviceName: 'Presoterapia' };
    expect(hasConflict(proposal, existing)).toBe(true);
  });

  test('facial vs corporal con solapamiento → sin conflicto (gabinetes distintos)', () => {
    // Limpieza Facial existe de 09:00-10:00 (facial).
    // Propuesta: Ondas Rusas 09:30-10:30 (corporal) — no debe conflictuar.
    const proposal = { start: '09:30', end: '10:30', serviceName: 'Ondas Rusas' };
    const facialOnly = [existing[0]]; // solo el turno facial
    expect(hasConflict(proposal, facialOnly)).toBe(false);
  });

  test('corporal vs facial con solapamiento → sin conflicto', () => {
    const proposal = { start: '09:30', end: '10:30', serviceName: 'Limpieza Facial Profunda' };
    const corporalOnly = [existing[1]]; // solo el turno corporal
    expect(hasConflict(proposal, corporalOnly)).toBe(false);
  });

  test('turno cancelado del mismo gabinete y horario → sin conflicto', () => {
    const cancelled = [
      { id: 'appt-3', start_time: '09:00', end_time: '10:00', service_name: 'Microneedling / Dermapen', status: 'cancelled' },
    ];
    const proposal = { start: '09:00', end: '10:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, cancelled)).toBe(false);
  });

  test('misma propuesta que el propio turno (edición) → sin conflicto con self-exclusión', () => {
    const proposal = { start: '09:00', end: '10:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, existing, 'appt-1')).toBe(false);
  });

  test('edición: no conflicto con sí mismo pero sí con otro del mismo gabinete', () => {
    const anotherFacial = [
      { id: 'appt-1', start_time: '09:00', end_time: '10:00', service_name: 'Limpieza Facial Profunda', status: 'confirmed' },
      { id: 'appt-4', start_time: '09:30', end_time: '10:30', service_name: 'Dermaplaning "Glow"', status: 'confirmed' },
    ];
    // Editamos appt-1 al mismo horario: no conflicto con sí mismo pero sí con appt-4
    const proposal = { start: '09:00', end: '10:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, anotherFacial, 'appt-1')).toBe(true);
  });

  test('sin turnos existentes → sin conflicto', () => {
    const proposal = { start: '09:00', end: '10:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, [])).toBe(false);
  });

  test('propuesta antes de todos los turnos → sin conflicto', () => {
    const proposal = { start: '07:00', end: '08:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, existing)).toBe(false);
  });

  test('propuesta después de todos los turnos → sin conflicto', () => {
    const proposal = { start: '15:00', end: '16:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, existing)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Múltiples turnos mezclados — facial y corporal simultáneos
// ---------------------------------------------------------------------------
describe('turnos simultáneos de distintos gabinetes', () => {
  test('facial y corporal pueden coexistir en el mismo horario', () => {
    const schedule = [
      { id: '1', start_time: '09:00', end_time: '10:00', service_name: 'Ondas Rusas', status: 'confirmed' },
    ];
    // Nuevo turno facial en el mismo horario → no conflicto
    const proposal = { start: '09:00', end: '10:00', serviceName: 'Limpieza Facial Profunda' };
    expect(hasConflict(proposal, schedule)).toBe(false);
  });

  test('dos faciales no pueden coincidir', () => {
    const schedule = [
      { id: '1', start_time: '09:00', end_time: '10:00', service_name: 'Limpieza Facial Profunda', status: 'confirmed' },
    ];
    const proposal = { start: '09:00', end: '10:00', serviceName: 'Peelings Químicos' };
    expect(hasConflict(proposal, schedule)).toBe(true);
  });

  test('dos corporales no pueden coincidir', () => {
    const schedule = [
      { id: '1', start_time: '14:00', end_time: '15:00', service_name: 'Presoterapia', status: 'confirmed' },
    ];
    const proposal = { start: '14:00', end: '15:00', serviceName: 'Lipoláser (por zona)' };
    expect(hasConflict(proposal, schedule)).toBe(true);
  });

  test('depilación definitiva va en gabinete facial', () => {
    expect(getGabinete('Depilación Definitiva')).toBe('facial');
  });

  test('depilación definitiva conflictúa con turno facial, no con corporal', () => {
    const schedule = [
      { id: '1', start_time: '10:00', end_time: '11:00', service_name: 'Limpieza Facial Profunda', status: 'confirmed' },
    ];
    const proposal = { start: '10:00', end: '11:00', serviceName: 'Depilación Definitiva' };
    expect(hasConflict(proposal, schedule)).toBe(true);

    const corporalSchedule = [
      { id: '2', start_time: '10:00', end_time: '11:00', service_name: 'Ondas Rusas', status: 'confirmed' },
    ];
    expect(hasConflict(proposal, corporalSchedule)).toBe(false);
  });
});
