/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/approvals/route.ts
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
    const statusFilter = searchParams.get('status');

    // Check if user has approval permissions
    if (!['hod', 'dean', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied. Only HODs, Deans, and Admins can access approvals.' },
        { status: 403 }
      );
    }

    // Build SQL for pending papers
    let sql = `
      SELECT 
        ep.id,
        ep.paper_code,
        ep.exam_type,
        ep.academic_year,
        ep.semester,
        ep.exam_date,
        ep.duration,
        ep.total_marks,
        ep.status,
        ep.created_by,
        ep.submitted_at,
        c.code AS course_code,
        c.title AS course_title,
        d.name AS department_name,
        CONCAT(creator.first_name, ' ', creator.last_name) AS lecturer_name,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') AS programmes
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users creator ON ep.created_by = creator.id
      LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
      LEFT JOIN programmes p ON epp.programme_id = p.id
      WHERE ep.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Role-based filtering
    if (role === 'hod') {
      sql += ` AND ep.hod_id = ?`;
      params.push(user_id);
      
      if (statusFilter === 'hod_review') {
        sql += ` AND ep.status = 'hod_review'`;
      } else if (statusFilter !== 'all' && statusFilter) {
        sql += ` AND ep.status = ?`;
        params.push(statusFilter);
      } else {
        sql += ` AND ep.status IN ('submitted', 'hod_review')`;
      }
    } else if (role === 'dean') {
      sql += ` AND ep.dean_id = ?`;
      params.push(user_id);
      
      if (statusFilter === 'dean_review') {
        sql += ` AND ep.status = 'dean_review'`;
      } else if (statusFilter !== 'all' && statusFilter) {
        sql += ` AND ep.status = ?`;
        params.push(statusFilter);
      } else {
        sql += ` AND ep.status IN ('hod_approved', 'dean_review')`;
      }
    } else if (role === 'admin') {
      if (statusFilter && statusFilter !== 'all') {
        sql += ` AND ep.status = ?`;
        params.push(statusFilter);
      } else {
        sql += ` AND ep.status IN ('submitted', 'hod_review', 'hod_approved', 'dean_review')`;
      }
    }

    sql += ` GROUP BY ep.id ORDER BY ep.submitted_at DESC`;

    const papers = await query<any[]>(sql, params);

    // Get statistics
    const today = new Date().toISOString().split('T')[0];
    
    let statsSQL = `
      SELECT
        COUNT(CASE WHEN ep.status IN ('submitted', 'hod_review', 'hod_approved', 'dean_review') THEN 1 END) as pending,
        COUNT(CASE WHEN DATE(ep.hod_approved_at) = ? AND ep.status IN ('hod_approved', 'dean_approved', 'ready_for_print') THEN 1 END) as approved_today,
        COUNT(CASE WHEN DATE(ep.updated_at) = ? AND ep.status IN ('hod_rejected', 'dean_rejected') THEN 1 END) as rejected_today,
        COUNT(CASE WHEN ep.status IN ('hod_approved', 'dean_approved', 'hod_rejected', 'dean_rejected') THEN 1 END) as total_processed
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      WHERE ep.deleted_at IS NULL
    `;

    const statsParams: any[] = [today, today];

    if (role === 'hod') {
      statsSQL += ` AND ep.hod_id = ?`;
      statsParams.push(user_id);
    } else if (role === 'dean') {
      statsSQL += ` AND ep.dean_id = ?`;
      statsParams.push(user_id);
    }

    const statsResult = await query<any[]>(statsSQL, statsParams);
    const stats = statsResult[0] || {
      pending: 0,
      approved_today: 0,
      rejected_today: 0,
      total_processed: 0,
    };

    return NextResponse.json({
      success: true,
      data: papers || [],
      stats,
      userRole: role,
    });
  } catch (error) {
    console.error('GET /api/approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals', details: String(error) },
      { status: 500 }
    );
  }
}