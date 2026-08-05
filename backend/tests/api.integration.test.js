'use strict';

/**
 * Integration tests for API endpoints.
 *
 * Uses supertest to test HTTP routes against an in-memory express app
 * with a mocked database pool, so no real DB connection is required.
 */

const request = require('supertest');

// ---- Mock the pg pool before any route requires it ----
jest.mock('../db/pool', () => {
  const mockQuery = jest.fn();
  return { query: mockQuery, connect: jest.fn(() => ({ query: mockQuery, release: jest.fn() })) };
});

const pool = require('../db/pool');

// Build a minimal express app with the routes we want to test
const express = require('express');
const servicesRouter = require('../routes/services');
const availabilityRouter = require('../routes/availability');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/services', servicesRouter);
  app.use('/api/availability', availabilityRouter);
  return app;
}

let app;

beforeEach(() => {
  jest.clearAllMocks();
  app = buildApp();
});

// ---------------------------------------------------------------------------
// GET /api/services
// ---------------------------------------------------------------------------
describe('GET /api/services', () => {
  test('devuelve lista de servicios activos (200)', async () => {
    const mockRows = [
      { id: 'svc-1', name: 'Limpieza Facial', description: 'Test', duration_minutes: 60, price: '35000', image_url: null },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockRows });

    const res = await request(app).get('/api/services');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Limpieza Facial');
  });

  test('devuelve array vacío cuando no hay servicios activos (200)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/services');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('devuelve 500 cuando la DB falla', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/services');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// GET /api/availability/:serviceId
// ---------------------------------------------------------------------------
describe('GET /api/availability/:serviceId', () => {
  const SERVICE_ID = 'svc-1';

  test('devuelve fechas disponibles para un servicio válido (200)', async () => {
    // 1st call: service lookup
    pool.query.mockResolvedValueOnce({
      rows: [{ id: SERVICE_ID, name: 'Limpieza Facial', duration_minutes: 60, is_active: true }],
    });
    // 2nd call: schedules — Lun-Vie activos
    pool.query.mockResolvedValueOnce({
      rows: [
        { day_of_week: 1, start_time: '09:00', end_time: '12:00', is_active: true },
        { day_of_week: 2, start_time: '09:00', end_time: '12:00', is_active: true },
        { day_of_week: 3, start_time: '09:00', end_time: '12:00', is_active: true },
        { day_of_week: 4, start_time: '09:00', end_time: '12:00', is_active: true },
        { day_of_week: 5, start_time: '09:00', end_time: '12:00', is_active: true },
      ],
    });
    // Remaining calls: blocked_slots checks (one per day checked) — all clear
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get(`/api/availability/${SERVICE_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dates');
    expect(Array.isArray(res.body.dates)).toBe(true);
  });

  test('devuelve 404 para servicio inexistente', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // service not found

    const res = await request(app).get('/api/availability/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('devuelve array vacío de fechas cuando no hay horarios configurados', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: SERVICE_ID, name: 'Limpieza Facial', duration_minutes: 60 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [] }); // no schedules

    const res = await request(app).get(`/api/availability/${SERVICE_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.dates).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/availability/:serviceId/:date
// ---------------------------------------------------------------------------
describe('GET /api/availability/:serviceId/:date', () => {
  const SERVICE_ID = 'svc-1';
  const DATE = '2026-08-10'; // Monday

  test('devuelve franjas disponibles para fecha válida (200)', async () => {
    // service
    pool.query.mockResolvedValueOnce({
      rows: [{ id: SERVICE_ID, name: 'Limpieza Facial', duration_minutes: 60 }],
    });
    // schedules for Monday (day_of_week = 1)
    pool.query.mockResolvedValueOnce({
      rows: [{ day_of_week: 1, start_time: '09:00', end_time: '12:00', slot_duration_minutes: 60, is_active: true }],
    });
    // existing appointments
    pool.query.mockResolvedValueOnce({ rows: [] });
    // blocked slots
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/availability/${SERVICE_ID}/${DATE}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slots');
    expect(Array.isArray(res.body.slots)).toBe(true);
    // 09:00-12:00 with 60 min duration → 3 slots
    expect(res.body.slots.length).toBeGreaterThanOrEqual(1);
  });

  test('devuelve array vacío de slots cuando el día no tiene horarios', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: SERVICE_ID, name: 'Limpieza Facial', duration_minutes: 60 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [] }); // no schedules for this day

    const res = await request(app).get(`/api/availability/${SERVICE_ID}/${DATE}`);

    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([]);
  });

  test('devuelve 404 para servicio inexistente', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/availability/nonexistent/${DATE}`);

    expect(res.status).toBe(404);
  });

  test('turnos existentes reducen las franjas disponibles', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: SERVICE_ID, name: 'Limpieza Facial', duration_minutes: 60 }],
    });
    pool.query.mockResolvedValueOnce({
      rows: [{ day_of_week: 1, start_time: '09:00', end_time: '12:00', slot_duration_minutes: 60, is_active: true }],
    });
    // existing appointment takes 09:00-10:00 (same gabinete = facial)
    pool.query.mockResolvedValueOnce({
      rows: [{ start_time: '09:00', end_time: '10:00', service_name: 'Limpieza Facial' }],
    });
    pool.query.mockResolvedValueOnce({ rows: [] }); // no blocked slots

    const res = await request(app).get(`/api/availability/${SERVICE_ID}/${DATE}`);

    expect(res.status).toBe(200);
    // 3 slots total, 1 occupied → 2 available
    const starts = res.body.slots.map(s => s.start);
    expect(starts).not.toContain('09:00');
    expect(starts).toContain('10:00');
    expect(starts).toContain('11:00');
  });
});
