// tests/unit/auth.unit.test.ts
// ─────────────────────────────────────────────────────────────
//  Unit tests for src/lib/auth.ts helper functions.
//  These do NOT need the Next.js server running.
//  They test pure logic: password hashing, role checks, etc.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock db.ts so unit tests never touch real Supabase ───────
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn(),
}));

// ── Mock next/headers (not available outside Next.js runtime) ─
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

import { hashPassword, verifyPassword, hasRole } from '@/lib/auth';
import type { UserPayload } from '@/lib/auth';
import { query } from '@/lib/db';

const mockedQuery = vi.mocked(query);

// ─────────────────────────────────────────────────────────────
describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('uems@2026');
    expect(hash).not.toBe('uems@2026');          // must be hashed
    expect(hash).toMatch(/^\$2[ab]\$/);           // bcrypt prefix
    const valid = await verifyPassword('uems@2026', hash);
    expect(valid).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('uems@2026');
    const valid = await verifyPassword('wrongpassword', hash);
    expect(valid).toBe(false);
  });

  it('produces different hashes for the same password (salting)', async () => {
    const hash1 = await hashPassword('uems@2026');
    const hash2 = await hashPassword('uems@2026');
    expect(hash1).not.toBe(hash2);
  });
});

// ─────────────────────────────────────────────────────────────
describe('hasRole', () => {
  const adminUser: UserPayload = {
    id: 1,
    email: 'admin@uems.ac.ug',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    department_id: null,
    college_id: null,
  };

  const lecturerUser: UserPayload = {
    ...adminUser,
    role: 'lecturer',
  };

  it('returns true when user has the required role', () => {
    expect(hasRole(adminUser, ['admin'])).toBe(true);
    expect(hasRole(adminUser, ['admin', 'hod'])).toBe(true);
  });

  it('returns false when user does not have the required role', () => {
    expect(hasRole(lecturerUser, ['admin', 'hod'])).toBe(false);
  });

  it('returns false for null user', () => {
    expect(hasRole(null, ['admin'])).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('loginUser — unit (mocked DB)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user not found', async () => {
    mockedQuery.mockResolvedValueOnce([]);   // no user rows
    const { loginUser } = await import('@/lib/auth');
    const result = await loginUser('nobody@uems.ac.ug', 'uems@2026');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid email or password/i);
  });

  it('returns error when account is inactive', async () => {
    const hash = await hashPassword('uems@2026');
    mockedQuery.mockResolvedValueOnce([
      { id: 1, email: 'test@uems.ac.ug', password_hash: hash, is_active: false,
        first_name: 'A', last_name: 'B', role: 'lecturer',
        department_id: null, college_id: null },
    ]);
    const { loginUser } = await import('@/lib/auth');
    const result = await loginUser('test@uems.ac.ug', 'uems@2026');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/inactive/i);
  });

  it('returns error when password is wrong', async () => {
    const hash = await hashPassword('uems@2026');
    mockedQuery.mockResolvedValueOnce([
      { id: 1, email: 'test@uems.ac.ug', password_hash: hash, is_active: true,
        first_name: 'A', last_name: 'B', role: 'lecturer',
        department_id: null, college_id: null },
    ]);
    const { loginUser } = await import('@/lib/auth');
    const result = await loginUser('test@uems.ac.ug', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid email or password/i);
  });

  it('returns success with sessionId on valid login', async () => {
    const hash = await hashPassword('uems@2026');

    // First call: SELECT user; second: UPDATE last_login; third: INSERT session
    mockedQuery
      .mockResolvedValueOnce([
        { id: 42, email: 'admin@uems.ac.ug', password_hash: hash, is_active: true,
          first_name: 'System', last_name: 'Admin', role: 'admin',
          department_id: null, college_id: null },
      ])
      .mockResolvedValueOnce({ affectedRows: 1, insertId: null })  // UPDATE last_login
      .mockResolvedValueOnce({ insertId: 'session-uuid', affectedRows: 1 }); // INSERT session

    const { loginUser } = await import('@/lib/auth');
    const result = await loginUser('admin@uems.ac.ug', 'uems@2026');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('admin@uems.ac.ug');
    expect(result.sessionId).toBeDefined();
  });
});