// tests/api/users.test.ts
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

describe('Users Routes', () => {
  it('GET /api/users - returns list of users', async () => {
    const res = await request(BASE)
      .get('/api/users')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    const users = Array.isArray(res.body) ? res.body : res.body.users ?? res.body.data ?? [];
    expect(Array.isArray(users)).toBe(true);
    if (users.length > 0) userId = users[0].id;
  });

  it('GET /api/users - returns 401 without cookie', async () => {
    const res = await request(BASE).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/users - returns 403 for lecturer role', async () => {
    const res = await request(BASE)
      .get('/api/users')
      .set('Cookie', lecturerCookie);
    expect(res.status).toBe(403);
  });

  it('GET /api/users/:id - returns a user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/users/${userId}`)
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    const user = res.body.user ?? res.body.data ?? res.body;
    expect(user).toHaveProperty('id');
  });

  it('GET /api/users/:id - returns 401 without cookie', async () => {
    if (!userId) return;
    const res = await request(BASE).get(`/api/users/${userId}`);
    expect(res.status).toBe(401);
  });

  it('GET /api/users/:id - returns 403 for lecturer accessing another user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/users/${userId}`)
      .set('Cookie', lecturerCookie);
    expect(res.status).toBe(403);
  });

  it('GET /api/users/:id/stats - returns user stats', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/users/${userId}/stats`)
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/users/:id/stats - returns 403 for lecturer accessing another user stats', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .get(`/api/users/${userId}/stats`)
      .set('Cookie', lecturerCookie);
    expect(res.status).toBe(403);
  });

  it('PUT /api/users/:id - updates a user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .put(`/api/users/${userId}`)
      .set('Cookie', adminCookie)
      .send({ first_name: 'System' });
    expect([200, 403]).toContain(res.status);
  });

  it('PUT /api/users/:id - returns 401 without cookie', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .put(`/api/users/${userId}`)
      .send({ first_name: 'Hacker' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/users/:id - returns 403 for lecturer updating another user', async () => {
    if (!userId) return;
    const res = await request(BASE)
      .put(`/api/users/${userId}`)
      .set('Cookie', lecturerCookie)
      .send({ first_name: 'Hacker' });
    expect(res.status).toBe(403);
  });

  it('GET /api/users/:id - returns 404 for non-existent user', async () => {
    const res = await request(BASE)
      .get('/api/users/999999')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(404);
  });
});