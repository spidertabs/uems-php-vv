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

    // Get candidates where the user is a supervisor (old schema compatibility) 
    // OR an assigned examiner (new schema)
    let whereClause = `(pc.supervisor_id = ? OR pc.co_supervisor_id = ? OR pc.id IN (
      SELECT vs_sub.candidate_id FROM viva_schedules vs_sub 
      JOIN viva_examiners ve_sub ON vs_sub.id = ve_sub.viva_id 
      WHERE ve_sub.examiner_id = ?
    ))`;
    const params: any[] = [user.id, user.id, user.id];

    // If HOD, also include all candidates in their department
    if (user.role === 'hod' && user.department_id) {
      whereClause = `(${whereClause} OR p.department_id = ?)`;
      params.push(user.department_id);
    }

    // Build query
    let sql = `
      SELECT DISTINCT
        pc.id,
        pc.registration_number,
        pc.thesis_title,
        pc.programme_id,
        pc.supervisor_id,
        pc.co_supervisor_id,
        pc.enrolment_year,
        pc.status,
        pc.created_at,
        pc.updated_at,
        CONCAT(st.first_name, ' ', st.last_name) as candidate_name,
        st.email as candidate_email,
        p.name as programme_name,
        COALESCE(COUNT(DISTINCT vs.id), 0) as upcoming_vivas,
        -- A candidate has a pending evaluation if there is an active viva schedule 
        -- where this lecturer is an examiner but hasn't submitted an evaluation yet
        (
          SELECT COUNT(*) FROM viva_schedules vs2
          JOIN viva_examiners ve2 ON vs2.id = ve2.viva_id
          LEFT JOIN viva_evaluations veval ON vs2.id = veval.viva_id AND veval.examiner_id = ve2.examiner_id
          WHERE vs2.candidate_id = pc.id 
            AND ve2.examiner_id = ?
            AND (veval.id IS NULL OR veval.is_submitted = FALSE)
            AND vs2.status IN ('scheduled', 'in_progress')
        ) as pending_evaluations
      FROM phd_candidates pc
      JOIN students st ON pc.registration_number = st.registration_number
      LEFT JOIN programmes p ON pc.programme_id = p.id
      LEFT JOIN viva_schedules vs ON pc.id = vs.candidate_id 
        AND vs.status IN ('scheduled', 'in_progress')
      WHERE ${whereClause} AND pc.deleted_at IS NULL
    `;

    // Add examiner_id for the subquery
    params.unshift(user.id);

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
    const countParams: any[] = [user.id, user.id, user.id];
    if (user.role === 'hod' && user.department_id) {
      countParams.push(user.department_id);
    }

    let countSql = `
      SELECT COUNT(DISTINCT pc.id) as total
      FROM phd_candidates pc
      JOIN programmes p ON pc.programme_id = p.id
      WHERE ${whereClause}
        AND pc.deleted_at IS NULL
    `;

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
