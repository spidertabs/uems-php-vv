/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/courses/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;

    // Check if course exists
    const courseCheck = await query<any[]>(
      'SELECT id FROM courses WHERE id = ?',
      [courseId]
    );

    if (courseCheck.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get study units count
    const studyUnitsResult = await query<any[]>(
      'SELECT COUNT(*) as count FROM study_units WHERE course_id = ?',
      [courseId]
    );

    // Get questions count
    const questionsResult = await query<any[]>(
      'SELECT COUNT(*) as count FROM questions WHERE course_id = ?',
      [courseId]
    );

    // Get exam papers count
    const papersResult = await query<any[]>(
      'SELECT COUNT(*) as count FROM exam_papers WHERE course_id = ?',
      [courseId]
    );

    // Get active lecturers count (lecturers with permissions for this course)
    const lecturersResult = await query<any[]>(
      `SELECT COUNT(DISTINCT lecturer_id) as count 
       FROM lecturer_permissions 
       WHERE course_id = ? AND is_active = TRUE`,
      [courseId]
    );

    const stats = {
      total_study_units: studyUnitsResult[0]?.count || 0,
      total_questions: questionsResult[0]?.count || 0,
      total_papers: papersResult[0]?.count || 0,
      active_lecturers: lecturersResult[0]?.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Failed to fetch course stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course stats' },
      { status: 500 }
    );
  }
}