/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/study-units/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let sql = `
      SELECT 
        su.id,
        su.code,
        su.name as title,
        su.description,
        su.course_id,
        su.sequence_order as week_number,
        su.learning_outcomes,
        su.is_active,
        c.code AS course_code,
        c.title AS course_title,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        (SELECT COUNT(*) FROM questions WHERE study_unit_id = su.id AND is_active = TRUE) as questions_count
      FROM study_units su
      LEFT JOIN courses c ON c.id = su.course_id
      LEFT JOIN users u ON su.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter based on role for lecturers
    if (user.role === 'lecturer') {
      sql += ` AND EXISTS (
        SELECT 1 FROM lecturer_permissions lp 
        WHERE lp.lecturer_id = ? 
        AND lp.course_id = su.course_id 
        AND lp.is_active = TRUE
      )`;
      params.push(user.id);
    } else if (user.role === 'hod') {
      sql += ` AND c.department_id = ?`;
      params.push(user.department_id);
    } else if (user.role === 'dean') {
      sql += ` AND c.college_id = ?`;
      params.push(user.college_id);
    }
    // Admin sees all study units

    sql += ` ORDER BY c.code, su.sequence_order`;

    const studyUnits = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      studyUnits,
      count: Array.isArray(studyUnits) ? studyUnits.length : 0
    });
  } catch (error) {
    console.error('GET /api/study-units error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study units' },
      { status: 500 }
    );
  }
}