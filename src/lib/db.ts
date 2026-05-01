// src/lib/db.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

let supabaseClient: ReturnType<typeof createClient> | undefined;

export function getClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  }
  return supabaseClient;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Safely inline params into SQL
// ─────────────────────────────────────────────────────────────────────────────

function inlineParams(sql: string, params: any[]): string {
  return sql.replace(/\$(\d+)(?:::\w+)?/g, (_, idx) => {
    const param = params[parseInt(idx) - 1];
    if (param === null || param === undefined) return 'NULL';
    if (typeof param === 'boolean') return param ? 'TRUE' : 'FALSE';
    if (typeof param === 'number') return String(param);
    if (param instanceof Date) return `'${param.toISOString()}'`;
    return `'${String(param).replace(/'/g, "''")}'`;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  SQL dialect normaliser (MySQL → PostgreSQL)
// ─────────────────────────────────────────────────────────────────────────────

function toPostgres(sql: string, params: any[] = []): string {
  let counter = 0;
  sql = sql.replace(/DATE_SUB\s*\(\s*NOW\s*\(\s*\)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,
    (_: string, n: string) => `NOW() - INTERVAL '${n} days'`);
  sql = sql.replace(/\bCURDATE\s*\(\s*\)/gi, 'CURRENT_DATE');
  sql = sql.replace(
    /GROUP_CONCAT\s*\(\s*DISTINCT\s+(\S+)\s+ORDER\s+BY\s+(\S+)\s+SEPARATOR\s+'([^']+)'\s*\)/gi,
    (_: string, col: string, _order: string, sep: string) =>
      `STRING_AGG(DISTINCT ${col}, '${sep}' ORDER BY ${col})`
  );
  sql = sql.replace(
    /GROUP_CONCAT\s*\(([^)]+)\s+SEPARATOR\s+'([^']+)'\s*\)/gi,
    (_: string, col: string, sep: string) => `STRING_AGG(${col.trim()}, '${sep}')`
  );
  sql = sql.replace(/HAVING\s+total\s*>\s*0/gi, 'HAVING COUNT(DISTINCT pc.id) > 0');
  sql = sql
    .replace(/\bis_active\s*=\s*1\b/gi, 'is_active = TRUE')
    .replace(/\bis_active\s*=\s*0\b/gi, 'is_active = FALSE')
    .replace(/;\s*$/, '');

  sql = sql.replace(/\?(?:::(\w+))?/g, (_: string, cast: string) => {
    const idx = counter++;
    const param = params[idx];
    const n = `$${idx + 1}`;
    if (cast) return `${n}::${cast}`;
    if (typeof param === 'number' && Number.isInteger(param)) return `${n}::int`;
    if (typeof param === 'boolean') return `${n}::boolean`;
    if (param instanceof Date) return `${n}::timestamptz`;
    return n;
  });

  return sql;
}

function isWriteStatement(sql: string): boolean {
  return /^\s*(INSERT|UPDATE|DELETE|CALL)\b/i.test(sql);
}

function isInsert(sql: string): boolean {
  return /^\s*INSERT\b/i.test(sql);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Execute SQL via Supabase Management API
// ─────────────────────────────────────────────────────────────────────────────

async function executeSql(finalSql: string): Promise<any[]> {
  const key = process.env.SUPABASE_ACCESS_TOKEN || supabaseServiceKey || supabaseAnonKey;
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ query: finalSql }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SQL error: ${err}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result?.rows ?? []);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main query helper
// ─────────────────────────────────────────────────────────────────────────────

export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T> {
  try {
    const pgSQL = toPostgres(sql, params);
    const finalSql = inlineParams(pgSQL, params);

    // DEBUG: Log the final SQL for investigation
    if (isWriteStatement(pgSQL)) {
      console.log('📝 SQL EXECUTE:', finalSql);
    }

    if (isInsert(pgSQL)) {
      const hasReturning = /RETURNING/i.test(finalSql);
      const insertSql = hasReturning ? finalSql : finalSql + ' RETURNING id';
      const rows = await executeSql(insertSql);
      return { insertId: rows[0]?.id ?? null, affectedRows: rows.length } as any as T;
    }

    if (isWriteStatement(pgSQL)) {
      await executeSql(finalSql);
      return { insertId: null, affectedRows: 1 } as any as T;
    }

    const rows = await executeSql(finalSql);
    return rows as T;

  } catch (error) {
    console.error('🔥 QUERY ERROR:', { sql, params, error });
    throw error;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = getClient();
    const { error } = await client.from('staff').select('count', { count: 'exact', head: true });
    if (error) { console.error('❌ DB connection failed:', error); return false; }
    console.log('✅ DB connection successful');
    return true;
  } catch (error) {
    console.error('❌ DB connection failed:', error); return false;
  }
}

export async function transaction<T>(
  callback: (conn: { execute: typeof query }) => Promise<T>
): Promise<T> {
  try {
    // For now, this is a fake transaction that just provides the expected interface
    return await callback({ execute: query });
  } catch (error) {
    console.error('❌ Transaction error:', error);
    throw error;
  }
}

export default getClient;