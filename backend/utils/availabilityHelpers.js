/**
 * Shared pure utility functions for availability and appointment calculations.
 * Extracted so they can be imported by routes and tested independently.
 */

/**
 * Calculate end time given a start time string (HH:MM) and duration in minutes.
 * Works correctly across midnight (e.g., 23:30 + 60 → 00:30).
 * @param {string} startTime - "HH:MM"
 * @param {number} durationMinutes
 * @returns {string} "HH:MM"
 */
function calculateEndTime(startTime, durationMinutes) {
  const parts = startTime.split(':');
  const totalMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]) + durationMinutes;
  const h = Math.floor(totalMinutes / 60) % 24; // wrap around midnight
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Convert a TIME string (HH:MM or HH:MM:SS) to total minutes since midnight.
 * @param {string|object} timeStr
 * @returns {number}
 */
function timeToMinutes(timeStr) {
  const str = typeof timeStr === 'string' ? timeStr : timeStr.toString();
  const parts = str.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

/**
 * Convert total minutes since midnight to "HH:MM".
 * @param {number} minutes
 * @returns {string}
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Generate consecutive time slots between startTime and endTime with the given duration.
 * The last slot must end exactly on or before endTime.
 * @param {string} startTime  - "HH:MM"
 * @param {string} endTime    - "HH:MM"
 * @param {number} durationMinutes
 * @returns {{ start: string, end: string }[]}
 */
function generateSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + durationMinutes <= end) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + durationMinutes),
    });
    current += durationMinutes;
  }

  return slots;
}

/**
 * Return true when time range [start1, end1) overlaps with [start2, end2).
 * @param {string} start1
 * @param {string} end1
 * @param {string} start2
 * @param {string} end2
 * @returns {boolean}
 */
function timeOverlaps(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

/**
 * Determine which gabinete (room) handles a service by its name.
 *
 * Gabinete 2 (corporal): ondas rusas, presoterapia, lipoláser / lipolaser
 * Gabinete 1 (facial):   everything else (facial treatments + depilación)
 *
 * @param {string} serviceName
 * @returns {'corporal'|'facial'}
 */
function getGabinete(serviceName) {
  const name = serviceName.toLowerCase();
  if (
    name.includes('ondas rusas') ||
    name.includes('presoterapia') ||
    name.includes('lipoláser') ||
    name.includes('lipolaser') ||
    name.includes('lipolá')
  ) {
    return 'corporal';
  }
  return 'facial';
}

module.exports = {
  calculateEndTime,
  timeToMinutes,
  minutesToTime,
  generateSlots,
  timeOverlaps,
  getGabinete,
};
