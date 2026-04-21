/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'dean', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isHOD = user.role === 'hod';
    const deptId = user.department_id;

    // Total candidates
    const totalCandidatesResult = await query<any[]>(
      `SELECT COUNT(pc.id) as count 
       FROM phd_candidates pc
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}`,
      isHOD ? [deptId] : []
    );
    const total_candidates = totalCandidatesResult[0]?.count || 0;

    // Upcoming vivás (scheduled in the future)
    const upcomingVivasResult = await query<any[]>(
      `SELECT COUNT(vs.id) as count FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN programmes p ON pc.programme_id = p.id
       WHERE vs.status = 'scheduled' AND vs.scheduled_date >= CURRENT_DATE
       AND pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}`,
      isHOD ? [deptId] : []
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
       ${isHOD ? 'AND p.department_id = ?' : ''}`,
      isHOD ? [deptId] : []
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
       ${isHOD ? 'AND p.department_id = ?' : ''}`,
      isHOD ? [deptId] : []
    );
    const outstanding_evaluations = outstandingEvaluationsResult[0]?.count || 0;

    // Status breakdown
    const statusBreakdownResult = await query<any[]>(
      `SELECT pc.status, COUNT(pc.id) as count 
       FROM phd_candidates pc
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       GROUP BY pc.status 
       ORDER BY count DESC`,
      isHOD ? [deptId] : []
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
         CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
         pc.registration_number,
         p.name as programme_name,
         vr.outcome,
         vr.issued_at
       FROM viva_recommendations vr
       JOIN viva_schedules vs ON vr.viva_id = vs.id
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN users u ON pc.user_id = u.id
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       ${isHOD ? 'AND p.department_id = ?' : ''}
       ORDER BY vr.issued_at DESC 
       LIMIT 5`,
      isHOD ? [deptId] : []
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
