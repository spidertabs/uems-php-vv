// src/lib/db.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from 'mysql2/promise';

// Database connection pool configuration
const poolConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uems',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Singleton pool
let pool: mysql.Pool | undefined;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

// ✅ SAFE QUERY HELPER (DO NOT SWALLOW ERRORS)
export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T> {
  const pool = getPool();

  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    // 🔥 LOG REAL MYSQL ERROR
    console.error('🔥 MYSQL QUERY ERROR:', {
      sql,
      params,
      error,
    });

    // 🔥 RE-THROW ORIGINAL ERROR (CRITICAL)
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Close pool (graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    console.log('Database pool closed');
  }
}

export default getPool;
