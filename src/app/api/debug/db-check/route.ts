/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/debug/db-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin to check database
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const checks: any = {};

    // Check 1: Total courses
    const coursesCount = await query('SELECT COUNT(*) as count FROM courses');
    checks.total_courses = Array.isArray(coursesCount) ? coursesCount[0]?.count : 0;

    // Check 2: Sample courses
    const sampleCourses = await query('SELECT id, code, title FROM courses LIMIT 5');
    checks.sample_courses = sampleCourses;

    // Check 3: Check if course 20 exists
    const course20 = await query('SELECT * FROM courses WHERE id = 20');
    checks.course_20 = Array.isArray(course20) ? course20[0] : null;

    // Check 4: Study units count
    const unitsCount = await query('SELECT COUNT(*) as count FROM study_units');
    checks.total_study_units = Array.isArray(unitsCount) ? unitsCount[0]?.count : 0;

    // Check 5: Questions count
    const questionsCount = await query('SELECT COUNT(*) as count FROM questions');
    checks.total_questions = Array.isArray(questionsCount) ? questionsCount[0]?.count : 0;

    // Check 6: Table structure
    const tables = await query('SHOW TABLES');
    checks.tables = tables;

    return NextResponse.json({ checks });
  } catch (error) {
    console.error('DB check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database', details: String(error) },
      { status: 500 }
    );
  }
}