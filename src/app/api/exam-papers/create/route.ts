/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['lecturer', 'hod', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { course_id, academic_year, semester, exam_type = 'final', duration = 180, total_marks = 100 } = body;

    if (!course_id || !academic_year || !semester) {
      return NextResponse.json(
        { error: 'course_id, academic_year, and semester are required' },
        { status: 400 }
      );
    }

    const courses = await query<any[]>('SELECT id, hod_id FROM courses WHERE id = ? LIMIT 1', [course_id]);
    if (!courses || courses.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courses[0];
    const paperCode = `EP-${course_id}-${academic_year.replace('/', '')}-S${semester}-${Date.now()}`;

    const result = await query<ResultSetHeader>(
      `INSERT INTO exam_papers 
        (paper_code, course_id, academic_year, semester, exam_type, duration, total_marks, status, created_by, hod_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [paperCode, course_id, academic_year, semester, exam_type, duration, total_marks, user.id, course.hod_id]
    );

    return NextResponse.json(
      { id: result.insertId, paper_code: paperCode, message: 'Exam paper created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating exam paper:', error);
    return NextResponse.json({ error: 'Failed to create exam paper' }, { status: 500 });
  }
}
