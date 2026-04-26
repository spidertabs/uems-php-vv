// tests/unit/db.unit.test.ts
// Tests the SQL dialect normaliser in db.ts (? → $N, is_active booleans, etc.)
// No real Supabase connection needed.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire supabase-js module before any imports
const mockedRpc = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockedRpc,
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

// Import AFTER mocks are set up
import { query } from '@/lib/db';

describe('SQL dialect normaliser (toPostgres)', () => {
  beforeEach(() => {
    mockedRpc.mockClear();
    mockedRpc.mockResolvedValue({ data: [], error: null });
  });

  it('converts ? placeholders to $1, $2, ...', async () => {
    await query('SELECT * FROM staff WHERE id = ? AND role = ?', [1, 'admin']);
    const callArgs = mockedRpc.mock.calls.at(-1) as [string, { p_sql: string; p_params: unknown[] }][];
    const { p_sql } = callArgs[1] as unknown as { p_sql: string };
    expect(p_sql).toContain('$1');
    expect(p_sql).toContain('$2');
    expect(p_sql).not.toContain('?');
  });

  it('converts is_active = 1 to is_active = TRUE', async () => {
    await query('SELECT * FROM staff WHERE is_active = 1', []);
    const callArgs = mockedRpc.mock.calls.at(-1) as unknown as [string, { p_sql: string }];
    expect(callArgs[1].p_sql).toContain('is_active = TRUE');
  });

  it('converts is_active = 0 to is_active = FALSE', async () => {
    await query('SELECT * FROM staff WHERE is_active = 0', []);
    const callArgs = mockedRpc.mock.calls.at(-1) as unknown as [string, { p_sql: string }];
    expect(callArgs[1].p_sql).toContain('is_active = FALSE');
  });

  it('strips trailing semicolons', async () => {
    await query('SELECT 1;', []);
    const callArgs = mockedRpc.mock.calls.at(-1) as unknown as [string, { p_sql: string }];
    expect(callArgs[1].p_sql).not.toMatch(/;\s*$/);
  });

  it('appends RETURNING id for INSERT statements and returns insertId', async () => {
    mockedRpc.mockResolvedValueOnce({ data: [{ id: 5 }], error: null });
    const result = await query<{ insertId: number }>('INSERT INTO staff (email) VALUES (?)', ['a@b.com']);
    const callArgs = mockedRpc.mock.calls.at(-1) as unknown as [string, { p_sql: string }];
    expect(callArgs[1].p_sql).toContain('RETURNING id');
    expect(result.insertId).toBe(5);
  });

  it('returns empty array for SELECT with no results', async () => {
    mockedRpc.mockResolvedValueOnce({ data: [], error: null });
    const result = await query('SELECT * FROM staff WHERE id = ?', [99999]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});