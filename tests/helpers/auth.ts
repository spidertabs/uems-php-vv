// tests/helpers/auth.ts
import request from 'supertest';

const BASE = 'http://localhost:3000';

export async function loginAs(email: string): Promise<string> {
  const res = await request(BASE)
    .post('/api/auth/login')
    .send({ email, password: 'uems@2026' });

  // Extract the session cookie from Set-Cookie header
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return sessionCookie.split(';')[0]; // e.g. "session=abc123"
}