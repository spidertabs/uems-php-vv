import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { enrollInCourse } from '@/lib/exams';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let data;
    if (user.role === 'student') {
      data = await query(
        `SELECT ce.*, c.title, c.code
         FROM course_enrollments ce
         JOIN courses c ON ce.course_id = c.id
         WHERE ce.student_id = ?`,
        [user.id]
      );
    } else {
      // Staff see all enrollments grouped by course
      data = await query(
        `SELECT c.id, c.code, c.title, COUNT(ce.id) as student_count
         FROM courses c
         LEFT JOIN course_enrollments ce ON c.id = ce.course_id
         GROUP BY c.id, c.code, c.title`
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can enroll' }, { status: 403 });
    }

    const { course_id, academic_year, semester } = await request.json();

    if (!course_id || !academic_year || !semester) {
      return NextResponse.json({ success: false, error: 'Missing registration details' }, { status: 400 });
    }

    await enrollInCourse(user.id, course_id, academic_year, semester);

    return NextResponse.json({ success: true, message: 'Enrolled successfully' });
  } catch (error: any) {
    console.error('❌ Enrollment error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
