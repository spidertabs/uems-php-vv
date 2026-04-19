// src/app/api/courses/[id]/study-units/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/courses/[id]/study-units
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const courseId = parseInt(resolvedParams.id, 10);

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

