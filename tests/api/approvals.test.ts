// tests/api/approvals.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { loginAs } from '../helpers/auth';

const BASE = 'http://localhost:3000';
let hodCookie: string;

beforeAll(async () => {
  hodCookie = await loginAs('hod.cs@uems.ac.ug');
});

describe('Approvals', () => {
  it('GET /api/approvals - returns approvals list', async () => {
    const res = await request(BASE).get('/api/approvals').set('Cookie', hodCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/approvals/pending - returns pending approvals', async () => {
    const res = await request(BASE).get('/api/approvals/pending').set('Cookie', hodCookie);
    expect(res.status).toBe(200);
  });
});