/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('course_id');
    const studyUnitId = searchParams.get('study_unit_id');
    const questionType = searchParams.get('question_type');
    const difficultyLevel = searchParams.get('difficulty_level');
    const isActive = searchParams.get('is_active');
    const getTypes = searchParams.get('types'); // New parameter to get question types

    // If requesting question types only
    if (getTypes === 'true') {
      const types = await query<any[]>(
        `SELECT DISTINCT question_type 
         FROM questions 
         WHERE question_type IS NOT NULL 
         AND question_type != '' 
         AND is_active = 1
         ORDER BY question_type ASC`,
        []
      );

      const questionTypes = types.map(t => t.question_type);

      return NextResponse.json({
        success: true,
        questionTypes,
        count: questionTypes.length
      });
    }

    // Regular questions query
    let sql = `
      SELECT 
        q.*,
        c.code as course_code,
        c.title as course_title,
        su.code as study_unit_code,
        su.name as study_unit_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM questions q
      LEFT JOIN courses c ON q.course_id = c.id
      LEFT JOIN study_units su ON q.study_unit_id = su.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users approver ON q.approved_by = approver.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (courseId) {
      sql += ' AND q.course_id = ?';
      params.push(courseId);
    }

    if (studyUnitId) {
      sql += ' AND q.study_unit_id = ?';
      params.push(studyUnitId);
    }

    if (questionType) {
      sql += ' AND q.question_type = ?';
      params.push(questionType);
    }

    if (difficultyLevel) {
      sql += ' AND q.difficulty_level = ?';
      params.push(difficultyLevel);
    }

    if (isActive !== null && isActive !== undefined) {
      sql += ' AND q.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY q.created_at DESC';

    const questions = await query(sql, params);

    return NextResponse.json({ 
      success: true,
      questions,
      count: Array.isArray(questions) ? questions.length : 0
    });
  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: String(error) },
      { status: 500 }
    );
  }
}