/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/reports/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session;

    // Check permissions
    if (!['admin', 'hod', 'dean', 'exam_master'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied. Only Admins, HODs, Deans, and Exam Masters can view reports.' },
        { status: 403 }
      );
    }

    // Overall system statistics
    const overallStats = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM exam_papers WHERE deleted_at IS NULL) as total_papers,
        (SELECT COUNT(*) FROM exam_papers WHERE status = 'draft' AND deleted_at IS NULL) as draft_papers,
        (SELECT COUNT(*) FROM exam_papers WHERE status IN ('submitted', 'hod_review', 'dean_review') AND deleted_at IS NULL) as pending_papers,
        (SELECT COUNT(*) FROM exam_papers WHERE status IN ('hod_approved', 'dean_approved', 'ready_for_print') AND deleted_at IS NULL) as approved_papers,
        (SELECT COUNT(*) FROM exam_papers WHERE status = 'printed' AND deleted_at IS NULL) as printed_papers,
        (SELECT COUNT(*) FROM questions WHERE deleted_at IS NULL) as total_questions,
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE AND deleted_at IS NULL) as active_users,
        (SELECT COUNT(*) FROM courses WHERE is_active = TRUE AND deleted_at IS NULL) as active_courses
    `);

    // Papers by exam type
    const papersByType = await query<any[]>(`
      SELECT 
        exam_type,
        COUNT(*) as count,
        SUM(CASE WHEN status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status IN ('submitted', 'hod_review', 'dean_review') THEN 1 ELSE 0 END) as pending
      FROM exam_papers
      WHERE deleted_at IS NULL
      GROUP BY exam_type
    `);

    // Papers by status
    const papersByStatus = await query<any[]>(`
      SELECT 
        status,
        COUNT(*) as count
      FROM exam_papers
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `);

    // Recent activity (last 30 days)
    const recentActivity = await query<any[]>(`
      SELECT 
        DATE(created_at) as activity_date,
        COUNT(*) as papers_created,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as papers_submitted,
        SUM(CASE WHEN status IN ('hod_approved', 'dean_approved') THEN 1 ELSE 0 END) as papers_approved
      FROM exam_papers
      WHERE deleted_at IS NULL 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY activity_date DESC
      LIMIT 30
    `);

    // Top performers (users with most papers)
    const topCreators = await query<any[]>(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.role,
        COUNT(ep.id) as total_papers,
        SUM(CASE WHEN ep.status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed') THEN 1 ELSE 0 END) as approved_papers
      FROM users u
      JOIN exam_papers ep ON u.id = ep.created_by
      WHERE u.deleted_at IS NULL 
        AND ep.deleted_at IS NULL
      GROUP BY u.id, u.first_name, u.last_name, u.role
      ORDER BY total_papers DESC
      LIMIT 10
    `);

    // Papers by college
    const papersByCollege = await query<any[]>(`
      SELECT 
        col.code,
        col.name,
        COUNT(DISTINCT ep.id) as total_papers,
        COUNT(DISTINCT c.id) as total_courses
      FROM colleges col
      LEFT JOIN courses c ON col.id = c.college_id
      LEFT JOIN exam_papers ep ON c.id = ep.course_id AND ep.deleted_at IS NULL
      WHERE col.deleted_at IS NULL
      GROUP BY col.id, col.code, col.name
      ORDER BY total_papers DESC
    `);

    // Questions statistics
    const questionStats = await query<any[]>(`
      SELECT 
        question_type,
        difficulty_level,
        COUNT(*) as count,
        AVG(marks) as avg_marks
      FROM questions
      WHERE deleted_at IS NULL AND is_active = TRUE
      GROUP BY question_type, difficulty_level
    `);

    return NextResponse.json({
      success: true,
      data: {
        overall: overallStats[0] || {},
        papersByType: papersByType || [],
        papersByStatus: papersByStatus || [],
        recentActivity: recentActivity || [],
        topCreators: topCreators || [],
        papersByCollege: papersByCollege || [],
        questionStats: questionStats || [],
      },
    });
  } catch (error) {
    console.error('GET /api/reports/dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard reports', details: String(error) },
      { status: 500 }
    );
  }
}