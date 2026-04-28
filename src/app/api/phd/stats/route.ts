/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'dean', 'hod', 'lecturer', 'professor', 'external_examiner'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isHOD = user.role === 'hod';
    const isLecturer = ['lecturer', 'professor', 'external_examiner'].includes(user.role);
    const deptId = user.department_id;
    const userId = user.id;

    // Base assignment filter for lecturers
    const assignmentSubquery = `(
      pc.supervisor_id = ? OR pc.co_supervisor_id = ? OR 
      pc.id IN (SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?) OR
      pc.id IN (SELECT vs_sub.candidate_id FROM viva_schedules vs_sub JOIN viva_examiners ve_sub ON vs_sub.id = ve_sub.viva_id WHERE ve_sub.examiner_id = ?)
    )`;
    const assignmentParams = [userId, userId, userId, userId];

    // Total candidates
    const totalCandidatesResult = await query<any[]>(
      `SELECT COUNT(pc.id) as count 
       FROM phd_candidates pc
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ${isLecturer ? `AND ${assignmentSubquery}` : ''}`,
      [...(isHOD ? [deptId] : []), ...(isLecturer ? assignmentParams : [])]
    );
    const total_candidates = totalCandidatesResult[0]?.count || 0;

    // Upcoming vivás (scheduled in the future)
    const upcomingVivasResult = await query<any[]>(
      `SELECT COUNT(vs.id) as count FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN programmes p ON pc.programme_id = p.id
       WHERE vs.status = 'scheduled' AND vs.scheduled_date >= CURRENT_DATE
       AND pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ${isLecturer ? `AND ${assignmentSubquery}` : ''}`,
      [...(isHOD ? [deptId] : []), ...(isLecturer ? assignmentParams : [])]
    );
    const upcoming_vivas = upcomingVivasResult[0]?.count || 0;

    // Pending outcomes (vivás completed but no recommendation yet)
    const pendingOutcomesResult = await query<any[]>(
      `SELECT COUNT(vs.id) as count FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN programmes p ON pc.programme_id = p.id
       WHERE vs.status = 'completed' 
       AND NOT EXISTS (SELECT 1 FROM viva_recommendations WHERE viva_id = vs.id)
       AND pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ${isLecturer ? `AND ${assignmentSubquery}` : ''}`,
      [...(isHOD ? [deptId] : []), ...(isLecturer ? assignmentParams : [])]
    );
    const pending_outcomes = pendingOutcomesResult[0]?.count || 0;

    // Outstanding evaluations (evaluations not yet submitted)
    const outstandingEvaluationsResult = await query<any[]>(
      `SELECT COUNT(ve.id) as count FROM viva_evaluations ve
       JOIN viva_schedules vs ON ve.viva_id = vs.id
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN programmes p ON pc.programme_id = p.id
       WHERE ve.is_submitted = FALSE
       AND pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ${isLecturer ? `AND ${assignmentSubquery}` : ''}`,
      [...(isHOD ? [deptId] : []), ...(isLecturer ? assignmentParams : [])]
    );
    const outstanding_evaluations = outstandingEvaluationsResult[0]?.count || 0;

    // Status breakdown
    const statusBreakdownResult = await query<any[]>(
      `SELECT pc.status, COUNT(pc.id) as count 
       FROM phd_candidates pc
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ${isLecturer ? `AND ${assignmentSubquery}` : ''}
       GROUP BY pc.status 
       ORDER BY count DESC`,
      [...(isHOD ? [deptId] : []), ...(isLecturer ? assignmentParams : [])]
    );
    const status_breakdown = statusBreakdownResult.map(row => ({
      status: row.status,
      count: row.count,
    }));

    // Recent outcomes (last 5 viva recommendations)
    const recentOutcomesResult = await query<any[]>(
      `SELECT 
         vr.id,
         vs.id as viva_id,
         COALESCE(CONCAT(s.first_name, ' ', s.last_name), pc.registration_number) as candidate_name,
         pc.registration_number,
         p.name as programme_name,
         vr.outcome,
         vr.issued_at
       FROM viva_recommendations vr
       JOIN viva_schedules vs ON vr.viva_id = vs.id
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       LEFT JOIN students s ON pc.registration_number = s.registration_number
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ${isLecturer ? `AND ${assignmentSubquery}` : ''}
       ORDER BY vr.issued_at DESC 
       LIMIT 5`,
      [...(isHOD ? [deptId] : []), ...(isLecturer ? assignmentParams : [])]
    );
    const recent_outcomes = recentOutcomesResult.map(row => ({
      viva_id: row.viva_id,
      candidate_name: row.candidate_name,
      registration_number: row.registration_number,
      programme_name: row.programme_name,
      outcome: row.outcome,
      issued_at: row.issued_at,
    }));

    return NextResponse.json({
      stats: {
        total_candidates,
        upcoming_vivas,
        pending_outcomes,
        outstanding_evaluations,
      },
      status_breakdown,
      recent_outcomes,
    });
  } catch (error) {
    console.error('Error fetching PhD stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PhD stats' },
      { status: 500 }
    );
  }
}
