/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/reports/papers/route.ts
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

    if (!['admin', 'hod', 'dean', 'exam_master'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const academicYear = searchParams.get('academic_year');
    const semester = searchParams.get('semester');
    const examType = searchParams.get('exam_type');
    const status = searchParams.get('status');
    const collegeFilter = searchParams.get('college_id');
    const departmentFilter = searchParams.get('department_id');

    let sql = '';
    const params: any[] = [];

    if (reportType === 'summary') {
      // Papers summary report
      sql = `
        SELECT 
          ep.id,
          ep.paper_code,
          ep.exam_type,
          ep.status,
          ep.academic_year,
          ep.semester,
          ep.total_marks,
          ep.exam_date,
          ep.created_at,
          ep.submitted_at,
          c.code as course_code,
          c.title as course_title,
          d.name as department_name,
          col.name as college_name,
          CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
          CONCAT(hod.first_name, ' ', hod.last_name) as hod_name,
          ep.hod_approved_at,
          GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes
        FROM exam_papers ep
        JOIN courses c ON ep.course_id = c.id
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN colleges col ON c.college_id = col.id
        LEFT JOIN users creator ON ep.created_by = creator.id
        LEFT JOIN users hod ON ep.hod_id = hod.id
        LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
        LEFT JOIN programmes p ON epp.programme_id = p.id
        WHERE ep.deleted_at IS NULL
      `;

      if (academicYear) {
        sql += ` AND ep.academic_year = ?`;
        params.push(parseInt(academicYear));
      }

      if (semester) {
        sql += ` AND ep.semester = ?`;
        params.push(parseInt(semester));
      }

      if (examType) {
        sql += ` AND ep.exam_type = ?`;
        params.push(examType);
      }

      if (status) {
        sql += ` AND ep.status = ?`;
        params.push(status);
      }

      if (collegeFilter) {
        sql += ` AND c.college_id = ?`;
        params.push(parseInt(collegeFilter));
      }

      if (departmentFilter) {
        sql += ` AND c.department_id = ?`;
        params.push(parseInt(departmentFilter));
      }

      // Role-based filtering
      if (role === 'hod') {
        sql += ` AND ep.hod_id = ?`;
        params.push(user_id);
      } else if (role === 'dean') {
        sql += ` AND c.college_id = ?`;
        params.push(college_id);
      }

      sql += ` GROUP BY ep.id ORDER BY ep.created_at DESC`;

    } else if (reportType === 'by_department') {
      // Papers grouped by department
      sql = `
        SELECT 
          d.id,
          d.name as department_name,
          col.name as college_name,
          COUNT(DISTINCT ep.id) as total_papers,
          SUM(CASE WHEN ep.status = 'draft' THEN 1 ELSE 0 END) as draft_papers,
          SUM(CASE WHEN ep.status IN ('submitted', 'hod_review', 'dean_review') THEN 1 ELSE 0 END) as pending_papers,
          SUM(CASE WHEN ep.status IN ('hod_approved', 'dean_approved', 'ready_for_print') THEN 1 ELSE 0 END) as approved_papers,
          SUM(CASE WHEN ep.status = 'printed' THEN 1 ELSE 0 END) as printed_papers,
          COUNT(DISTINCT c.id) as total_courses
        FROM departments d
        LEFT JOIN colleges col ON d.college_id = col.id
        LEFT JOIN courses c ON d.id = c.department_id AND c.deleted_at IS NULL
        LEFT JOIN exam_papers ep ON c.id = ep.course_id AND ep.deleted_at IS NULL
        WHERE d.deleted_at IS NULL
      `;

      if (academicYear) {
        sql += ` AND ep.academic_year = ?`;
        params.push(parseInt(academicYear));
      }

      if (semester) {
        sql += ` AND ep.semester = ?`;
        params.push(parseInt(semester));
      }

      sql += ` GROUP BY d.id, d.name, col.name ORDER BY total_papers DESC`;

    } else if (reportType === 'by_lecturer') {
      // Papers grouped by lecturer
      sql = `
        SELECT 
          u.id,
          CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
          u.email,
          d.name as department_name,
          COUNT(ep.id) as total_papers,
          SUM(CASE WHEN ep.status = 'draft' THEN 1 ELSE 0 END) as draft_papers,
          SUM(CASE WHEN ep.status IN ('submitted', 'hod_review', 'dean_review') THEN 1 ELSE 0 END) as pending_papers,
          SUM(CASE WHEN ep.status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed') THEN 1 ELSE 0 END) as approved_papers,
          SUM(CASE WHEN ep.status IN ('hod_rejected', 'dean_rejected') THEN 1 ELSE 0 END) as rejected_papers
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN exam_papers ep ON u.id = ep.created_by AND ep.deleted_at IS NULL
        WHERE u.role = 'lecturer' AND u.deleted_at IS NULL
      `;

      if (departmentFilter) {
        sql += ` AND u.department_id = ?`;
        params.push(parseInt(departmentFilter));
      }

      if (academicYear) {
        sql += ` AND ep.academic_year = ?`;
        params.push(parseInt(academicYear));
      }

      sql += ` GROUP BY u.id, u.first_name, u.last_name, u.email, d.name ORDER BY total_papers DESC`;

    } else if (reportType === 'by_status') {
      // Papers workflow analysis
      sql = `
        SELECT 
          ep.status,
          COUNT(*) as count,
          AVG(TIMESTAMPDIFF(DAY, ep.created_at, COALESCE(ep.submitted_at, NOW()))) as avg_days_to_submit,
          AVG(TIMESTAMPDIFF(DAY, ep.submitted_at, COALESCE(ep.hod_approved_at, NOW()))) as avg_days_to_hod_approval
        FROM exam_papers ep
        WHERE ep.deleted_at IS NULL
      `;

      if (academicYear) {
        sql += ` AND ep.academic_year = ?`;
        params.push(parseInt(academicYear));
      }

      sql += ` GROUP BY ep.status ORDER BY count DESC`;
    }

    const results = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: results || [],
      reportType,
    });
  } catch (error) {
    console.error('GET /api/reports/papers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers report', details: String(error) },
      { status: 500 }
    );
  }
}