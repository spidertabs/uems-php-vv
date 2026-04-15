/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'dean'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Total candidates
    const totalCandidatesResult = await query<any[]>(
      `SELECT COUNT(*) as count FROM phd_candidates WHERE deleted_at IS NULL`
    );
    const total_candidates = totalCandidatesResult[0]?.count || 0;

    // Upcoming vivás (scheduled in the future)
    const upcomingVivasResult = await query<any[]>(
      `SELECT COUNT(*) as count FROM viva_schedules 
       WHERE status = 'scheduled' AND scheduled_date >= CURDATE()
       AND candidate_id IN (SELECT id FROM phd_candidates WHERE deleted_at IS NULL)`
    );
    const upcoming_vivas = upcomingVivasResult[0]?.count || 0;

    // Pending outcomes (vivás completed but no recommendation yet)
    const pendingOutcomesResult = await query<any[]>(
      `SELECT COUNT(*) as count FROM viva_schedules vs
       WHERE vs.status = 'completed' 
       AND NOT EXISTS (SELECT 1 FROM viva_recommendations WHERE viva_id = vs.id)
       AND vs.candidate_id IN (SELECT id FROM phd_candidates WHERE deleted_at IS NULL)`
    );
    const pending_outcomes = pendingOutcomesResult[0]?.count || 0;

    // Outstanding evaluations (evaluations not yet submitted)
    const outstandingEvaluationsResult = await query<any[]>(
      `SELECT COUNT(*) as count FROM viva_evaluations 
       WHERE is_submitted = FALSE
       AND viva_id IN (
         SELECT vs.id FROM viva_schedules vs 
         WHERE vs.candidate_id IN (SELECT id FROM phd_candidates WHERE deleted_at IS NULL)
       )`
    );
    const outstanding_evaluations = outstandingEvaluationsResult[0]?.count || 0;

    // Status breakdown
    const statusBreakdownResult = await query<any[]>(
      `SELECT status, COUNT(*) as count 
       FROM phd_candidates 
       WHERE deleted_at IS NULL
       GROUP BY status 
       ORDER BY count DESC`
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
       ORDER BY vr.issued_at DESC 
       LIMIT 5`
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
