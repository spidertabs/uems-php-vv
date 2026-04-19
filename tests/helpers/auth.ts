// tests/helpers/auth.ts
import request from 'supertest';
import type { Response } from 'supertest';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Logs in as a user and returns the session cookie string.
 * Throws a descriptive error if login fails so you know WHY it failed.
 */
export async function loginAs(
  email: string,
  password = 'uems@2026'
): Promise<string> {
  let res: Response;

  try {
    res = await (request(BASE)
      .post('/api/auth/login')
      .send({ email, password })
      .timeout(10000) as unknown as Promise<Response>);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `❌ Cannot reach Next.js server at ${BASE}\n` +
      `   Make sure you ran: npm run dev\n` +
      `   Original error: ${msg}`
    );
  }

  if (res.status !== 200) {
    throw new Error(
      `❌ Login failed for ${email}\n` +
      `   Status : ${res.status}\n` +
      `   Body   : ${JSON.stringify(res.body, null, 2)}\n\n` +
      `   Common causes:\n` +
      `   • Wrong Supabase URL (check .env.test → should be 127.0.0.1:54321)\n` +
      `   • User doesn't exist in local DB — run: psql ... -f sql/seed.sql\n` +
      `   • execute_query RPC function not installed in local Supabase`
    );
  }

  const setCookie = res.headers['set-cookie'] as string | string[] | undefined;
  if (!setCookie) {
    throw new Error(
      `❌ Login succeeded but no session cookie was set for ${email}\n` +
      `   Response body: ${JSON.stringify(res.body)}`
    );
  }

  const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return sessionCookie.split(';')[0]; // e.g. "session=abc123"
}

/**
 * Returns { cookie, userId, role } so tests don't need a second /me call.
 */
export async function loginAndGetUser(
  email: string,
  password = 'uems@2026'
): Promise<{ cookie: string; userId: number; role: string }> {
  const res = await (request(BASE)
    .post('/api/auth/login')
    .send({ email, password }) as unknown as Promise<Response>);

  if (res.status !== 200) {
    throw new Error(`loginAndGetUser: login failed for ${email} — ${JSON.stringify(res.body)}`);
  }

  const setCookie = res.headers['set-cookie'] as string | string[];
  const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const cookie = sessionCookie.split(';')[0];

  return {
    cookie,
    userId: res.body.user?.id,
    role: res.body.user?.role,
  };
}