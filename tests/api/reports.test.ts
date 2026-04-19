// tests/api/reports.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { loginAs } from '../helpers/auth';

const BASE = 'http://localhost:3000';
let adminCookie: string;

beforeAll(async () => {
  adminCookie = await loginAs('admin@uems.ac.ug');
});

describe('Reports', () => {
  it('GET /api/reports/dashboard', async () => {
    const res = await request(BASE).get('/api/reports/dashboard').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/papers', async () => {
    const res = await request(BASE).get('/api/reports/papers').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/questions', async () => {
    const res = await request(BASE).get('/api/reports/questions').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/workflow', async () => {
    const res = await request(BASE).get('/api/reports/workflow').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
  });
});