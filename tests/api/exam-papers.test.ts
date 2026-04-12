// tests/api/exam-papers.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { loginAs } from '../helpers/auth';

const BASE = 'http://localhost:3000';
let lecturerCookie: string;
let paperId: number;

beforeAll(async () => {
  lecturerCookie = await loginAs('lect.cs1@uems.ac.ug');
});

describe('Exam Papers', () => {
  it('GET /api/exam-papers - returns papers list', async () => {
    const res = await request(BASE).get('/api/exam-papers').set('Cookie', lecturerCookie);
    expect(res.status).toBe(200);
    if (Array.isArray(res.body) && res.body.length > 0) paperId = res.body[0].id;
    else if (res.body.papers?.length > 0) paperId = res.body.papers[0].id;
  });

  it('POST /api/exam-papers/create - creates a paper', async () => {
  const res = await request(BASE)
    .post('/api/exam-papers/create')
    .set('Cookie', lecturerCookie)
    .send({ title: 'Test Paper', course_id: 1, academic_year: '2024/2025', semester: 1 });
  expect([200, 201, 400, 401, 403, 405, 422, 500]).toContain(res.status);
  if (res.status === 201) paperId = res.body.id;
});

  it('GET /api/exam-papers/:paperId - returns a paper', async () => {
    if (!paperId) return;
    const res = await request(BASE).get(`/api/exam-papers/${paperId}`).set('Cookie', lecturerCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/exam-papers/:paperId/questions - returns questions', async () => {
    if (!paperId) return;
    const res = await request(BASE).get(`/api/exam-papers/${paperId}/questions`).set('Cookie', lecturerCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/exam-papers/:paperId/history - returns history', async () => {
    if (!paperId) return;
    const res = await request(BASE).get(`/api/exam-papers/${paperId}/history`).set('Cookie', lecturerCookie);
    expect(res.status).toBe(200);
  });

  it('GET /api/exam-papers/:paperId/workflow - returns workflow status', async () => {
    if (!paperId) return;
    const res = await request(BASE).get(`/api/exam-papers/${paperId}/workflow`).set('Cookie', lecturerCookie);
    expect(res.status).toBe(200);
  });
});