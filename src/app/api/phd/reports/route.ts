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
    const totalResult = await query<any[]>(
      `SELECT COUNT(*) as count FROM phd_candidates WHERE deleted_at IS NULL`
    );
    const total_candidates = totalResult[0]?.count || 0;

    // Status breakdown
    const statusResult = await query<any[]>(
      `SELECT pc.status, COUNT(*) as count
       FROM phd_candidates pc
       WHERE pc.deleted_at IS NULL
       GROUP BY pc.status
       ORDER BY count DESC`
    );
    const status_breakdown = statusResult.map(row => ({
      status: row.status,
      count: row.count,
    }));

    // Outcome breakdown
    const outcomeResult = await query<any[]>(
      `SELECT vr.outcome, COUNT(*) as count
       FROM viva_recommendations vr
       JOIN viva_schedules vs ON vr.viva_id = vs.id
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       WHERE pc.deleted_at IS NULL
       GROUP BY vr.outcome
       ORDER BY count DESC`
    );
    const outcome_breakdown = outcomeResult.map(row => ({
      outcome: row.outcome,
      count: row.count,
    }));

    // Programme breakdown (with pass/awarded rates)
    const programmeResult = await query<any[]>(
      `SELECT 
         p.code as programme_code,
         p.name as programme_name,
         COUNT(DISTINCT pc.id) as total,
         COUNT(DISTINCT CASE WHEN vr.outcome = 'pass' OR vr.outcome = 'pass_with_minor_corrections' OR vr.outcome = 'pass_with_major_corrections' THEN pc.id END) as awarded
       FROM programmes p
       LEFT JOIN phd_candidates pc ON p.id = pc.programme_id AND pc.deleted_at IS NULL
       LEFT JOIN viva_schedules vs ON pc.id = vs.candidate_id
       LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
       GROUP BY p.id, p.code, p.name
       HAVING total > 0
       ORDER BY total DESC`
    );
    const programme_breakdown = programmeResult.map(row => ({
      programme_code: row.programme_code,
      programme_name: row.programme_name,
      total: row.total,
      awarded: row.awarded,
    }));

    // Upcoming vivás in next 30 days (evaluations not all submitted yet)
    const upcomingResult = await query<any[]>(
      `SELECT 
         vs.id as viva_id,
         CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
         pc.registration_number,
         p.name as programme_name,
         vs.scheduled_date,
         vs.scheduled_time,
         vs.venue,
         (SELECT COUNT(*) FROM viva_evaluations WHERE viva_id = vs.id AND is_submitted = TRUE) as evaluations_submitted,
         (SELECT COUNT(*) FROM viva_examiners WHERE viva_id = vs.id) as total_examiners
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN users u ON pc.user_id = u.id
       JOIN programmes p ON pc.programme_id = p.id
       WHERE pc.deleted_at IS NULL
       AND vs.status = 'scheduled'
       AND vs.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY vs.scheduled_date ASC
       LIMIT 10`
    );
    const upcoming_vivas = upcomingResult.map(row => ({
      viva_id: row.viva_id,
      candidate_name: row.candidate_name,
      registration_number: row.registration_number,
      programme_name: row.programme_name,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      venue: row.venue,
      evaluations_submitted: row.evaluations_submitted,
      total_examiners: row.total_examiners,
    }));

    // Pending actions (vivás completed but no recommendation, or recommendations issued but no corrections submitted)
    const pendingResult = await query<any[]>(
      `SELECT 
         vs.id as viva_id,
         CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
         pc.registration_number,
         CASE 
           WHEN vs.status = 'completed' AND NOT EXISTS (SELECT 1 FROM viva_recommendations WHERE viva_id = vs.id) THEN 'Awaiting recommendation'
           WHEN vr.outcome IN ('pass_with_minor_corrections', 'pass_with_major_corrections') AND vs.status = 'completed' THEN 'Awaiting corrections'
           ELSE 'Other'
         END as reason,
         COALESCE(vs.updated_at, vs.created_at) as since
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN users u ON pc.user_id = u.id
       LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
       WHERE pc.deleted_at IS NULL
       AND (
         (vs.status = 'completed' AND NOT EXISTS (SELECT 1 FROM viva_recommendations WHERE viva_id = vs.id))
         OR (vr.outcome IN ('pass_with_minor_corrections', 'pass_with_major_corrections') AND vs.status = 'completed')
       )
       ORDER BY since ASC
       LIMIT 20`
    );
    const pending_actions = pendingResult.map(row => ({
      viva_id: row.viva_id,
      candidate_name: row.candidate_name,
      registration_number: row.registration_number,
      reason: row.reason,
      since: row.since,
    }));

    return NextResponse.json({
      total_candidates,
      status_breakdown,
      outcome_breakdown,
      programme_breakdown,
      upcoming_vivas,
      pending_actions,
    });
  } catch (error) {
    console.error('Error fetching PhD reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PhD reports' },
      { status: 500 }
    );
  }
}
