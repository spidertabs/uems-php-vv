/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/reports/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: user_id, department_id } = session;

    if (!['admin', 'hod', 'dean'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const courseId = searchParams.get('course_id');
    const departmentFilter = searchParams.get('department_id');

    let sql = '';
    const params: any[] = [];

    if (reportType === 'summary') {
      // Questions summary by course
      sql = `
        SELECT 
          c.id as course_id,
          c.code as course_code,
          c.title as course_title,
          d.name as department_name,
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT CASE WHEN q.question_type = 'multiple_choice' THEN q.id END) as mcq_count,
          COUNT(DISTINCT CASE WHEN q.question_type = 'true_false' THEN q.id END) as tf_count,
          COUNT(DISTINCT CASE WHEN q.question_type = 'essay' THEN q.id END) as essay_count,
          COUNT(DISTINCT CASE WHEN q.question_type = 'short_answer' THEN q.id END) as short_answer_count,
          COUNT(DISTINCT CASE WHEN q.difficulty_level = 'easy' THEN q.id END) as easy_count,
          COUNT(DISTINCT CASE WHEN q.difficulty_level = 'medium' THEN q.id END) as medium_count,
          COUNT(DISTINCT CASE WHEN q.difficulty_level = 'hard' THEN q.id END) as hard_count,
          AVG(q.marks) as avg_marks,
          SUM(q.usage_count) as total_usage
        FROM courses c
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN questions q ON c.id = q.course_id AND q.deleted_at IS NULL AND q.is_active = TRUE
        WHERE c.deleted_at IS NULL AND c.is_active = TRUE
      `;

      if (courseId) {
        sql += ` AND c.id = ?`;
        params.push(parseInt(courseId));
      }

      if (departmentFilter) {
        sql += ` AND c.department_id = ?`;
        params.push(parseInt(departmentFilter));
      }

      if (role === 'hod') {
        sql += ` AND c.hod_id = ?`;
        params.push(user_id);
      }

      sql += ` GROUP BY c.id, c.code, c.title, d.name ORDER BY total_questions DESC`;

    } else if (reportType === 'by_difficulty') {
      // Questions grouped by difficulty
      sql = `
        SELECT 
          q.difficulty_level,
          q.question_type,
          COUNT(*) as count,
          AVG(q.marks) as avg_marks,
          AVG(q.usage_count) as avg_usage,
          AVG(q.avg_student_score) as avg_performance
        FROM questions q
        JOIN courses c ON q.course_id = c.id
        WHERE q.deleted_at IS NULL AND q.is_active = TRUE
      `;

      if (courseId) {
        sql += ` AND q.course_id = ?`;
        params.push(parseInt(courseId));
      }

      if (departmentFilter) {
        sql += ` AND c.department_id = ?`;
        params.push(parseInt(departmentFilter));
      }

      sql += ` GROUP BY q.difficulty_level, q.question_type ORDER BY q.difficulty_level, count DESC`;

    } else if (reportType === 'by_creator') {
      // Questions grouped by creator
      sql = `
        SELECT 
          u.id,
          CONCAT(u.first_name, ' ', u.last_name) as creator_name,
          u.email,
          d.name as department_name,
          COUNT(q.id) as total_questions,
          COUNT(CASE WHEN q.is_active = TRUE THEN 1 END) as active_questions,
          SUM(q.usage_count) as total_usage,
          AVG(q.marks) as avg_marks
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN questions q ON u.id = q.created_by AND q.deleted_at IS NULL
        WHERE u.deleted_at IS NULL AND u.role IN ('lecturer', 'hod')
      `;

      if (departmentFilter) {
        sql += ` AND u.department_id = ?`;
        params.push(parseInt(departmentFilter));
      }

      sql += ` GROUP BY u.id, u.first_name, u.last_name, u.email, d.name ORDER BY total_questions DESC`;

    } else if (reportType === 'usage_stats') {
      // Most and least used questions
      sql = `
        SELECT 
          q.id,
          LEFT(q.question_text, 100) as question_preview,
          q.question_type,
          q.difficulty_level,
          q.marks,
          q.usage_count,
          q.avg_student_score,
          c.code as course_code,
          c.title as course_title,
          CONCAT(u.first_name, ' ', u.last_name) as created_by
        FROM questions q
        JOIN courses c ON q.course_id = c.id
        LEFT JOIN users u ON q.created_by = u.id
        WHERE q.deleted_at IS NULL AND q.is_active = TRUE
      `;

      if (courseId) {
        sql += ` AND q.course_id = ?`;
        params.push(parseInt(courseId));
      }

      sql += ` ORDER BY q.usage_count DESC LIMIT 50`;

    } else if (reportType === 'bloom_taxonomy') {
      // Questions by Bloom's taxonomy
      sql = `
        SELECT 
          q.bloom_taxonomy,
          q.difficulty_level,
          COUNT(*) as count,
          AVG(q.marks) as avg_marks,
          SUM(q.usage_count) as total_usage
        FROM questions q
        JOIN courses c ON q.course_id = c.id
        WHERE q.deleted_at IS NULL AND q.is_active = TRUE
          AND q.bloom_taxonomy IS NOT NULL
      `;

      if (courseId) {
        sql += ` AND q.course_id = ?`;
        params.push(parseInt(courseId));
      }

      if (departmentFilter) {
        sql += ` AND c.department_id = ?`;
        params.push(parseInt(departmentFilter));
      }

      sql += ` GROUP BY q.bloom_taxonomy, q.difficulty_level ORDER BY q.bloom_taxonomy`;
    }

    const results = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: results || [],
      reportType,
    });
  } catch (error) {
    console.error('GET /api/reports/questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions report', details: String(error) },
      { status: 500 }
    );
  }
}