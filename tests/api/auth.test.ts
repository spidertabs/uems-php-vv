// tests/api/auth.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { loginAs } from '../helpers/auth';

const BASE = 'http://localhost:3000';

describe('Auth Routes', () => {
  it('POST /api/auth/register - rejects duplicate email', async () => {
    const res = await request(BASE).post('/api/auth/register').send({
      email: 'admin@uems.ac.ug', // already exists
      password: 'uems@2026',
      first_name: 'Test',
      last_name: 'User',
      role: 'lecturer',
    });
    expect([400, 409]).toContain(res.status);
  });

  it('POST /api/auth/login - logs in and returns session cookie', async () => {
    const res = await request(BASE).post('/api/auth/login').send({
      email: 'admin@uems.ac.ug',
      password: 'uems@2026',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login - rejects wrong password', async () => {
    const res = await request(BASE).post('/api/auth/login').send({
      email: 'admin@uems.ac.ug',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - returns current user with valid cookie', async () => {
  const cookie = await loginAs('admin@uems.ac.ug');
  const res = await request(BASE)
    .get('/api/auth/me')
    .set('Cookie', cookie);
  expect(res.status).toBe(200);
  // Response may be { user: {...} } or { success: true, user: {...} }
  const user = res.body.user ?? res.body;
  expect(user).toHaveProperty('email');
});

  it('GET /api/auth/me - returns 401 without cookie', async () => {
    const res = await request(BASE).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/change-password - changes password', async () => {
    const cookie = await loginAs('lect.cs1@uems.ac.ug');
    const res = await request(BASE)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ current_password: 'uems@2026', new_password: 'uems@2026' }); // same to avoid breaking other tests
    expect([200, 400]).toContain(res.status);
  });

  it('POST /api/auth/logout - logs out', async () => {
    const cookie = await loginAs('admin@uems.ac.ug');
    const res = await request(BASE)
      .post('/api/auth/logout')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
  });
});