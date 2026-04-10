/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/question-bank/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: user_id, department_id, college_id } = session;
    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');

    let sql = `
      SELECT 
        q.id,
        q.course_id,
        q.study_unit_id,
        q.question_text,
        q.question_type,
        q.marks,
        q.difficulty_level,
        q.bloom_taxonomy as bloom_level,
        q.options,
        q.correct_answer,
        q.learning_outcome as answer_explanation,
        q.tags,
        q.is_active,
        c.code AS course_code,
        c.title AS course_title,
        su.name AS study_unit_title,
        CONCAT(creator.first_name, ' ', creator.last_name) AS created_by_name,
        q.created_at,
        q.updated_at,
        q.usage_count,
        NULL as last_used
      FROM questions q
      JOIN courses c ON q.course_id = c.id
      LEFT JOIN study_units su ON q.study_unit_id = su.id
      LEFT JOIN users creator ON q.created_by = creator.id
      WHERE q.is_active = TRUE
    `;

    const params: any[] = [];

    // Filter by course_id if provided
    if (course_id) {
      sql += ` AND q.course_id = ?`;
      params.push(course_id);
    }

    // Filter based on role
    if (role === 'lecturer') {
      // Lecturers see questions from courses they have permission for or created
      sql += `
        AND (q.created_by = ? OR EXISTS (
          SELECT 1 FROM lecturer_permissions lp 
          WHERE lp.lecturer_id = ? 
          AND lp.course_id = q.course_id 
          AND lp.is_active = TRUE
        ))
      `;
      params.push(user_id, user_id);
    } else if (role === 'hod') {
      // HODs see all questions in their department
      sql += ` AND c.department_id = ?`;
      params.push(department_id);
    } else if (role === 'dean') {
      // Deans see all questions in their college
      sql += ` AND c.college_id = ?`;
      params.push(college_id);
    }

    // Admin sees all questions (no additional filter)

    sql += ` ORDER BY q.created_at DESC`;

    console.log('Executing question query with role:', role, 'params:', params);

    const questions = await query<any[]>(sql, params);

    console.log('Found questions:', questions.length);

    // Parse JSON fields
    const processedQuestions = questions.map(q => ({
      ...q,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      tags: q.tags ? (typeof q.tags === 'string' ? q.tags : JSON.parse(q.tags)) : null,
    }));

    return NextResponse.json({ 
      success: true,
      questions: processedQuestions,
      count: processedQuestions.length
    });
  } catch (error) {
    console.error('GET /api/question-bank error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: String(error) },
      { status: 500 }
    );
  }
}