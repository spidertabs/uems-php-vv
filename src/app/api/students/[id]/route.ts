/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const student = await query<any[]>(
      `SELECT 
        s.id, s.registration_number, s.email, s.first_name, s.last_name, s.phone,
        s.programme_id, p.name as programme_name,
        s.college_id, c.name as college_name,
        s.department_id, d.name as department_name,
        s.enrolment_year, s.study_year, s.semester, s.is_active, s.created_at
      FROM students s
      LEFT JOIN programmes p ON s.programme_id = p.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE s.id = ?`,
      [id]
    );

    if (student.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: student[0],
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { is_active, study_year, semester } = await req.json();

    await query(
      `UPDATE students SET is_active = ?, study_year = ?, semester = ? WHERE id = ?`,
      [is_active, study_year, semester, id]
    );

    return NextResponse.json({ success: true, message: 'Student updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
