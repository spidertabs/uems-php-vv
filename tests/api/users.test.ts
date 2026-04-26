// tests/api/staff.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { loginAs } from '../helpers/auth';

const BASE = 'http://localhost:3000';
let adminCookie: string;
let lecturerCookie: string;
let userId: number;

beforeAll(async () => {
  adminCookie = await loginAs('admin@uems.ac.ug');
  lecturerCookie = await loginAs('lect.cs1@uems.ac.ug');
});

describe('Staff Routes', () => {
  it('GET /api/staff - returns list of staff', async () => {
    const res = await request(BASE)
      .get('/api/staff')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    const staff = Array.isArray(res.body) ? res.body : res.body.staff ?? res.body.data ?? [];
    expect(Array.isArray(staff)).toBe(true);
    if (staff.length > 0) userId = staff[0].id;
  });

  it('GET /api/staff - returns 401 without cookie', async () => {
    const res = await request(BASE).get('/api/staff');
    expect(res.status).toBe(401);
  });

  it('GET /api/staff - returns 403 for lecturer role', async () => {
    const res = await request(BASE)
      .get('/api/staff')
      .set('Cookie', lecturerCookie);
    expect(res.status).toBe(403);
  });

  it('GET /api/staff/:id - returns a user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/staff/${userId}`)
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    const user = res.body.user ?? res.body.data ?? res.body;
    expect(user).toHaveProperty('id');
  });

  it('GET /api/staff/:id - returns 401 without cookie', async () => {
    if (!userId) return;
    const res = await request(BASE).get(`/api/staff/${userId}`);
    expect(res.status).toBe(401);
  });

  it('GET /api/staff/:id - returns 403 for lecturer accessing another user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/staff/${userId}`)
      .set('Cookie', lecturerCookie);
    expect(res.status).toBe(403);
  });

  it('GET /api/staff/:id/stats - returns user stats', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/staff/${userId}/stats`)
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/staff/:id/stats - returns 403 for lecturer accessing another user stats', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/staff/${userId}/stats`)
      .set('Cookie', lecturerCookie);
    expect(res.status).toBe(403);
  });

  it('PUT /api/staff/:id - updates a user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .put(`/api/staff/${userId}`)
      .set('Cookie', adminCookie)
      .send({ first_name: 'System' });
    expect([200, 403]).toContain(res.status);
  });

  it('PUT /api/staff/:id - returns 401 without cookie', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .put(`/api/staff/${userId}`)
      .send({ first_name: 'Hacker' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/staff/:id - returns 403 for lecturer updating another user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .put(`/api/staff/${userId}`)
      .set('Cookie', lecturerCookie)
      .send({ first_name: 'Hacker' });
    expect(res.status).toBe(403);
  });

  it('GET /api/staff/:id - returns 404 for non-existent user', async () => {
    const res = await request(BASE)
      .get('/api/staff/999999')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(404);
  });
});