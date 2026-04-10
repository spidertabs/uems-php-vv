/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/reports/workflow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Helper function to convert string numbers to actual numbers
function convertNumericFields(data: any[]): any[] {
  return data.map(row => {
    const converted: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Convert numeric string fields to numbers
      if (value !== null && value !== undefined && typeof value === 'string' && !isNaN(Number(value))) {
        // Check if it's a numeric field by key name
        if (
          key.includes('count') || 
          key.includes('avg_') || 
          key.includes('min_') || 
          key.includes('max_') || 
          key.includes('days') || 
          key.includes('total_') ||
          key.includes('_rate') ||
          key.includes('_time') ||
          key === 'approval_rate' ||
          key === 'resubmission_rate'
        ) {
          converted[key] = parseFloat(value as string);
        } else {
          converted[key] = value;
        }
      } else {
        converted[key] = value;
      }
    }
    return converted;
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session;

    if (!['admin', 'hod', 'dean', 'exam_master'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'approval_timeline';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const departmentId = searchParams.get('department_id');
    const statusFilter = searchParams.get('status');

    let sql = '';
    const params: any[] = [];

    if (reportType === 'approval_timeline') {
      // Average time spent in each status
      sql = `
        SELECT 
          ep.status,
          COUNT(*) as count,
          AVG(TIMESTAMPDIFF(DAY, ep.created_at, COALESCE(ep.updated_at, NOW()))) as avg_days_in_status,
          MIN(TIMESTAMPDIFF(DAY, ep.created_at, COALESCE(ep.updated_at, NOW()))) as min_days,
          MAX(TIMESTAMPDIFF(DAY, ep.created_at, COALESCE(ep.updated_at, NOW()))) as max_days
        FROM exam_papers ep
        WHERE ep.deleted_at IS NULL
      `;

      if (startDate) {
        sql += ` AND DATE(ep.created_at) >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND DATE(ep.created_at) <= ?`;
        params.push(endDate);
      }

      if (departmentId) {
        sql += ` AND ep.course_id IN (SELECT id FROM courses WHERE department_id = ?)`;
        params.push(departmentId);
      }

      sql += ` GROUP BY ep.status ORDER BY count DESC`;

    } else if (reportType === 'bottlenecks') {
      // Papers stuck in workflow
      sql = `
        SELECT 
          ep.id,
          ep.paper_code,
          c.code as course_code,
          c.title as course_title,
          ep.status as current_status,
          CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
          d.name as department_name,
          ep.created_at,
          ep.submitted_at,
          ep.updated_at as last_updated,
          TIMESTAMPDIFF(DAY, COALESCE(ep.submitted_at, ep.created_at), NOW()) as days_in_current_status
        FROM exam_papers ep
        JOIN courses c ON ep.course_id = c.id
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN users creator ON ep.created_by = creator.id
        WHERE ep.deleted_at IS NULL
          AND ep.status NOT IN ('draft', 'printed', 'published')
      `;

      if (startDate) {
        sql += ` AND DATE(ep.created_at) >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND DATE(ep.created_at) <= ?`;
        params.push(endDate);
      }

      if (departmentId) {
        sql += ` AND c.department_id = ?`;
        params.push(departmentId);
      }

      if (statusFilter) {
        sql += ` AND ep.status = ?`;
        params.push(statusFilter);
      }

      sql += ` ORDER BY days_in_current_status DESC LIMIT 100`;

    } else if (reportType === 'approver_performance') {
      // Performance metrics for approvers (HODs and Deans)
      sql = `
        SELECT 
          u.id as approver_id,
          CONCAT(u.first_name, ' ', u.last_name) as approver_name,
          u.role,
          COUNT(DISTINCT CASE WHEN wh.action IN ('hod_approved', 'dean_approved') THEN wh.exam_paper_id END) as total_approvals,
          AVG(CASE 
            WHEN wh.action IN ('hod_approved', 'dean_approved') 
            THEN TIMESTAMPDIFF(DAY, ep.submitted_at, wh.created_at)
            ELSE NULL 
          END) as avg_approval_time,
          COUNT(DISTINCT CASE WHEN ep.status IN ('hod_review', 'dean_review') AND 
            ((u.role = 'hod' AND ep.hod_id = u.id) OR (u.role = 'dean' AND ep.dean_id = u.id))
            THEN ep.id END) as pending_approvals,
          COUNT(DISTINCT CASE WHEN wh.action IN ('hod_rejected', 'dean_rejected') THEN wh.exam_paper_id END) as rejected_papers,
          (COUNT(DISTINCT CASE WHEN wh.action IN ('hod_approved', 'dean_approved') THEN wh.exam_paper_id END) * 100.0 / 
           NULLIF(COUNT(DISTINCT CASE WHEN wh.action IN ('hod_approved', 'dean_approved', 'hod_rejected', 'dean_rejected') THEN wh.exam_paper_id END), 0)) as approval_rate
        FROM users u
        LEFT JOIN workflow_history wh ON wh.actor_id = u.id
        LEFT JOIN exam_papers ep ON wh.exam_paper_id = ep.id
        WHERE u.role IN ('hod', 'dean', 'exam_master')
          AND u.deleted_at IS NULL
      `;

      if (startDate) {
        sql += ` AND (wh.created_at IS NULL OR DATE(wh.created_at) >= ?)`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND (wh.created_at IS NULL OR DATE(wh.created_at) <= ?)`;
        params.push(endDate);
      }

      if (departmentId) {
        sql += ` AND u.department_id = ?`;
        params.push(departmentId);
      }

      sql += ` GROUP BY u.id, u.first_name, u.last_name, u.role 
               HAVING total_approvals > 0 OR pending_approvals > 0 OR rejected_papers > 0
               ORDER BY total_approvals DESC`;

    } else if (reportType === 'activity_trends') {
      // Daily workflow activity trends
      sql = `
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(CASE WHEN action = 'created' THEN 1 END) as papers_created,
          COUNT(CASE WHEN action = 'submitted' THEN 1 END) as papers_submitted,
          COUNT(CASE WHEN action IN ('hod_approved', 'dean_approved') THEN 1 END) as papers_approved,
          COUNT(CASE WHEN action IN ('hod_rejected', 'dean_rejected') THEN 1 END) as papers_rejected,
          COUNT(CASE WHEN action = 'printed' THEN 1 END) as papers_printed
        FROM workflow_history
        WHERE 1=1
      `;

      if (startDate) {
        sql += ` AND DATE(created_at) >= ?`;
        params.push(startDate);
      } else {
        sql += ` AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
      }

      if (endDate) {
        sql += ` AND DATE(created_at) <= ?`;
        params.push(endDate);
      }

      sql += ` GROUP BY DATE(created_at) ORDER BY activity_date DESC LIMIT 60`;

    } else if (reportType === 'rejection_analysis') {
      // Rejection analysis by status and exam type
      sql = `
        SELECT 
          CASE 
            WHEN wh.action = 'hod_rejected' THEN 'hod_rejected'
            WHEN wh.action = 'dean_rejected' THEN 'dean_rejected'
            ELSE wh.action
          END as status,
          ep.exam_type,
          COUNT(DISTINCT wh.exam_paper_id) as total_rejected,
          AVG(TIMESTAMPDIFF(DAY, ep.submitted_at, wh.created_at)) as avg_rejection_time,
          (COUNT(DISTINCT CASE 
            WHEN EXISTS(
              SELECT 1 FROM workflow_history wh2 
              WHERE wh2.exam_paper_id = wh.exam_paper_id 
                AND wh2.created_at > wh.created_at 
                AND wh2.action = 'submitted'
            ) THEN wh.exam_paper_id 
          END) * 100.0 / COUNT(DISTINCT wh.exam_paper_id)) as resubmission_rate
        FROM workflow_history wh
        JOIN exam_papers ep ON wh.exam_paper_id = ep.id
        WHERE wh.action IN ('hod_rejected', 'dean_rejected')
          AND ep.deleted_at IS NULL
      `;

      if (startDate) {
        sql += ` AND DATE(wh.created_at) >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND DATE(wh.created_at) <= ?`;
        params.push(endDate);
      }

      if (departmentId) {
        sql += ` AND ep.course_id IN (SELECT id FROM courses WHERE department_id = ?)`;
        params.push(departmentId);
      }

      sql += ` GROUP BY status, ep.exam_type ORDER BY total_rejected DESC`;

    } else {
      // Default: return empty result for unknown report types
      return NextResponse.json({
        success: true,
        data: [],
        reportType,
        message: 'Unknown report type'
      });
    }

    const results = await query<any[]>(sql, params);

    // Convert numeric string fields to actual numbers
    const convertedResults = convertNumericFields(results || []);

    return NextResponse.json({
      success: true,
      data: convertedResults,
      reportType,
    });
  } catch (error) {
    console.error('GET /api/reports/workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow report', details: String(error) },
      { status: 500 }
    );
  }
}