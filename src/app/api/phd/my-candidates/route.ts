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
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Get candidates where the user is a supervisor (old schema compatibility) 
    // OR a supervisor (new schema) OR an assigned examiner (new schema)
    let whereClause = `(pc.supervisor_id = ? OR pc.co_supervisor_id = ? OR pc.id IN (
      SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?
    ) OR pc.id IN (
      SELECT vs_sub.candidate_id FROM viva_schedules vs_sub 
      JOIN viva_examiners ve_sub ON vs_sub.id = ve_sub.viva_id 
      WHERE ve_sub.examiner_id = ?
    ))`;
    const baseParams: any[] = [user.id, user.id, user.id, user.id];

    // If HOD, also include all candidates in their department
    if (user.role === 'hod' && user.department_id) {
      whereClause = `(${whereClause} OR p.department_id = ?)`;
      baseParams.push(user.department_id);
    }

    // Build params for the SELECT part (14 placeholders)
    const selectParams: any[] = Array(14).fill(user.id);

    // Build query
    let sql = `
      SELECT 
        pc.id as candidate_id,
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
        p.code as programme_code,
        -- Counts
        (SELECT COUNT(*) FROM thesis_submissions ts WHERE ts.candidate_id = pc.id) as thesis_count,
        (SELECT COUNT(*) FROM viva_schedules vs WHERE vs.candidate_id = pc.id) as viva_count,
        (SELECT COUNT(*) FROM viva_schedules vs WHERE vs.candidate_id = pc.id AND vs.status IN ('scheduled', 'in_progress')) as upcoming_vivas,
        -- Determine the user's role for this candidate
        CASE 
          WHEN pc.supervisor_id = ? THEN 'primary'
          WHEN pc.co_supervisor_id = ? THEN 'co_supervisor'
          WHEN pc.id IN (SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?) THEN 'supervisor'
          WHEN pc.id IN (SELECT vs_sub.candidate_id FROM viva_schedules vs_sub JOIN viva_examiners ve_sub ON vs_sub.id = ve_sub.viva_id WHERE ve_sub.examiner_id = ?) THEN 'examiner'
          ELSE 'other'
        END as role_as_supervisor,
        -- Pending evaluations
        (
          SELECT COUNT(*) FROM viva_schedules vs2
          LEFT JOIN viva_evaluations veval ON vs2.id = veval.viva_id AND veval.examiner_id = ?
          WHERE vs2.candidate_id = pc.id 
            AND (
              vs2.id IN (SELECT ve2.viva_id FROM viva_examiners ve2 WHERE ve2.examiner_id = ?)
              OR pc.supervisor_id = ? 
              OR pc.co_supervisor_id = ? 
              OR pc.id IN (SELECT pcs2.candidate_id FROM phd_candidate_supervisors pcs2 WHERE pcs2.supervisor_id = ?)
            )
            AND (veval.id IS NULL OR veval.is_submitted = FALSE)
            AND vs2.status IN ('scheduled', 'in_progress')
        ) as pending_evaluations,
        (
          SELECT vs2.id FROM viva_schedules vs2
          LEFT JOIN viva_evaluations veval ON vs2.id = veval.viva_id AND veval.examiner_id = ?
          WHERE vs2.candidate_id = pc.id 
            AND (
              vs2.id IN (SELECT ve2.viva_id FROM viva_examiners ve2 WHERE ve2.examiner_id = ?)
              OR pc.supervisor_id = ? 
              OR pc.co_supervisor_id = ? 
              OR pc.id IN (SELECT pcs3.candidate_id FROM phd_candidate_supervisors pcs3 WHERE pcs3.supervisor_id = ?)
            )
            AND (veval.id IS NULL OR veval.is_submitted = FALSE)
            AND vs2.status IN ('scheduled', 'in_progress')
          LIMIT 1
        ) as pending_viva_id
      FROM phd_candidates pc
      JOIN students st ON pc.registration_number = st.registration_number
      LEFT JOIN programmes p ON pc.programme_id = p.id
      WHERE ${whereClause} AND pc.deleted_at IS NULL
    `;

    const finalParams = [...selectParams, ...baseParams];

    // Add status filter if provided
    if (status) {
      sql += ` AND pc.status = ?`;
      finalParams.push(status);
    }

    // Add search filter if provided
    if (search) {
      sql += ` AND (st.first_name LIKE ? OR st.last_name LIKE ? OR pc.registration_number LIKE ? OR pc.thesis_title LIKE ?)`;
      const searchVal = `%${search}%`;
      finalParams.push(searchVal, searchVal, searchVal, searchVal);
    }

    sql += ` ORDER BY pc.updated_at DESC
             LIMIT ? OFFSET ?`;
    
    finalParams.push(limit, offset);

    const candidates = await query<any[]>(sql, finalParams);

    // Get total count
    const countParams = [...baseParams];
    let countSql = `
      SELECT COUNT(DISTINCT pc.id) as total
      FROM phd_candidates pc
      JOIN students st ON pc.registration_number = st.registration_number
      LEFT JOIN programmes p ON pc.programme_id = p.id
      WHERE ${whereClause}
        AND pc.deleted_at IS NULL
    `;

    if (status) {
      countSql += ` AND pc.status = ?`;
      countParams.push(status);
    }

    if (search) {
      countSql += ` AND (st.first_name LIKE ? OR st.last_name LIKE ? OR pc.registration_number LIKE ? OR pc.thesis_title LIKE ?)`;
      const searchVal = `%${search}%`;
      countParams.push(searchVal, searchVal, searchVal, searchVal);
    }

    const countResult = await query<any[]>(countSql, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: candidates,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
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

