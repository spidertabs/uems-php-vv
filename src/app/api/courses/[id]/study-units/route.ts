// src/app/api/courses/[id]/study-units/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Generic query helper
async function query<T>(sql: string, params: any[] = []): Promise<T> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

// GET /api/courses/[id]/study-units
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const courseId = resolvedParams.id;

  try {
    const studyUnits = await query<any[]>(
      `SELECT 
          su.*,
          (SELECT COUNT(*) FROM questions q WHERE q.study_unit_id = su.id AND q.is_active = 1) AS questions_count
       FROM study_units su
       WHERE su.course_id = ?
       ORDER BY su.sequence_order ASC`,
      [courseId]
    );

    return NextResponse.json({ studyUnits });
  } catch (error) {
    console.error('Get study units error:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}

