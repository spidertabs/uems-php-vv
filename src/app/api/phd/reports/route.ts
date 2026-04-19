// src/app/api/phd/reports/route.ts
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

    // ── Total candidates
    const totalResult = await query<any[]>(
      `SELECT COUNT(*) as count FROM phd_candidates WHERE deleted_at IS NULL`
    );
    const total_candidates = parseInt(totalResult[0]?.count ?? '0', 10);

    // ── Status breakdown
    const statusResult = await query<any[]>(
      `SELECT status, COUNT(*) as count
       FROM phd_candidates
       WHERE deleted_at IS NULL
       GROUP BY status
       ORDER BY count DESC`
    );
    const status_breakdown = statusResult.map(row => ({
      status: row.status,
      count:  parseInt(row.count, 10),
    }));

    // ── Outcome breakdown
    // outcome lives in viva_recommendations, not viva_schedules
    const outcomeResult = await query<any[]>(
      `SELECT vr.outcome, COUNT(*) as count
       FROM viva_recommendations vr
       JOIN viva_schedules vs   ON vr.viva_id = vs.id
       JOIN phd_candidates pc   ON vs.candidate_id = pc.id
       WHERE pc.deleted_at IS NULL
         AND vr.outcome IS NOT NULL
       GROUP BY vr.outcome
       ORDER BY count DESC`
    );
    const outcome_breakdown = outcomeResult.map(row => ({
      outcome: row.outcome,
      count:   parseInt(row.count, 10),
    }));

    // ── Programme breakdown
    // outcome from viva_recommendations via LEFT JOINs
    const programmeResult = await query<any[]>(
      `SELECT
         p.code  AS programme_code,
         p.name  AS programme_name,
         COUNT(DISTINCT pc.id) AS total,
         COUNT(DISTINCT CASE
           WHEN vr.outcome IN (
             'pass',
             'pass_with_minor_corrections',
             'pass_with_major_corrections'
           ) THEN pc.id
         END) AS awarded
       FROM programmes p
       LEFT JOIN phd_candidates pc
         ON p.id = pc.programme_id AND pc.deleted_at IS NULL
       LEFT JOIN viva_schedules vs
         ON pc.id = vs.candidate_id
       LEFT JOIN viva_recommendations vr
         ON vs.id = vr.viva_id
       GROUP BY p.id, p.code, p.name
       HAVING COUNT(DISTINCT pc.id) > 0
       ORDER BY total DESC`
    );
    const programme_breakdown = programmeResult.map(row => ({
      programme_code: row.programme_code,
      programme_name: row.programme_name,
      total:   parseInt(row.total,   10),
      awarded: parseInt(row.awarded, 10),
    }));

    // ── Upcoming vivás (next 30 days, status = scheduled)
    const upcomingResult = await query<any[]>(
      `SELECT
         vs.id AS viva_id,
         CONCAT(u.first_name, ' ', u.last_name) AS candidate_name,
         pc.registration_number,
         p.name  AS programme_name,
         vs.scheduled_date,
         vs.scheduled_time,
         vs.venue,
         (SELECT COUNT(*)
          FROM viva_evaluations ve
          WHERE ve.viva_id = vs.id
            AND ve.is_submitted = TRUE)  AS evaluations_submitted,
         (SELECT COUNT(*)
          FROM viva_examiners vex
          WHERE vex.viva_id = vs.id)     AS total_examiners
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN users u           ON pc.user_id       = u.id
       JOIN programmes p      ON pc.programme_id  = p.id
       WHERE pc.deleted_at IS NULL
         AND vs.status = 'scheduled'
         AND vs.scheduled_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
       ORDER BY vs.scheduled_date ASC
       LIMIT 10`
    );
    const upcoming_vivas = upcomingResult.map(row => ({
      viva_id:               row.viva_id,
      candidate_name:        row.candidate_name,
      registration_number:   row.registration_number,
      programme_name:        row.programme_name,
      scheduled_date:        row.scheduled_date,
      scheduled_time:        row.scheduled_time,
      venue:                 row.venue,
      evaluations_submitted: parseInt(row.evaluations_submitted, 10),
      total_examiners:       parseInt(row.total_examiners,       10),
    }));

    // ── Pending actions
    // completed vivás missing a recommendation OR awaiting corrections
    const pendingResult = await query<any[]>(
      `SELECT
         vs.id AS viva_id,
         CONCAT(u.first_name, ' ', u.last_name) AS candidate_name,
         pc.registration_number,
         CASE
           WHEN vr.id IS NULL
             THEN 'Awaiting recommendation'
           WHEN vr.outcome IN (
             'pass_with_minor_corrections',
             'pass_with_major_corrections'
           ) THEN 'Awaiting corrections'
           ELSE 'Other'
         END AS reason,
         COALESCE(vs.updated_at, vs.created_at) AS since
       FROM viva_schedules vs
       JOIN phd_candidates pc  ON vs.candidate_id = pc.id
       JOIN users u            ON pc.user_id       = u.id
       LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
       WHERE pc.deleted_at IS NULL
         AND vs.status = 'completed'
         AND (
           vr.id IS NULL
           OR vr.outcome IN (
             'pass_with_minor_corrections',
             'pass_with_major_corrections'
           )
         )
       ORDER BY since ASC
       LIMIT 20`
    );
    const pending_actions = pendingResult.map(row => ({
      viva_id:             row.viva_id,
      candidate_name:      row.candidate_name,
      registration_number: row.registration_number,
      reason:              row.reason,
      since:               row.since,
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