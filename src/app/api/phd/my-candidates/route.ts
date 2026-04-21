/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { query } from '@/lib/db';

/**
 * GET /api/phd/my-candidates
 * Get all PhD candidates assigned to the current lecturer (as supervisor/co-supervisor or examiner)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(user, 'view_assigned_candidates')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query to get candidates where lecturer is supervisor/co-supervisor
    let sql = `
      SELECT DISTINCT
        pc.id,
        pc.user_id,
        pc.registration_number,
        pc.thesis_title,
        pc.programme_id,
        pc.supervisor_id,
        pc.co_supervisor_id,
        pc.enrolment_year,
        pc.status,
        pc.created_at,
        pc.updated_at,
        u.name as candidate_name,
        u.email as candidate_email,
        p.name as programme_name,
        COALESCE(COUNT(DISTINCT vs.id), 0) as upcoming_vivas,
        COALESCE(COUNT(DISTINCT ve.id), 0) as pending_evaluations
      FROM phd_candidates pc
      LEFT JOIN users u ON pc.user_id = u.id
      LEFT JOIN programmes p ON pc.programme_id = p.id
      LEFT JOIN viva_schedules vs ON pc.id = vs.candidate_id 
        AND vs.status IN ('scheduled', 'in_progress')
      LEFT JOIN viva_evaluations ve ON vs.id = ve.viva_id 
        AND ve.examiner_id = ? 
        AND ve.originality_score IS NULL
      WHERE (pc.supervisor_id = ? OR pc.co_supervisor_id = ?)
        AND pc.deleted_at IS NULL
    `;

    const params: any[] = [user.id, user.id, user.id];

    // Add status filter if provided
    if (status) {
      sql += ` AND pc.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY pc.id
             ORDER BY pc.updated_at DESC
             LIMIT ? OFFSET ?`;
    
    params.push(limit, offset);

    const candidates = await query<any[]>(sql, params);

    // Get total count
    let countSql = `
      SELECT COUNT(DISTINCT pc.id) as total
      FROM phd_candidates pc
      WHERE (pc.supervisor_id = ? OR pc.co_supervisor_id = ?)
        AND pc.deleted_at IS NULL
    `;
    const countParams: any[] = [user.id, user.id];

    if (status) {
      countSql += ` AND pc.status = ?`;
      countParams.push(status);
    }

    const countResult = await query<any[]>(countSql, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: candidates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
