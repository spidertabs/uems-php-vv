/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/notifications.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Helper functions for PhD Viva Voce notification side-effects.
//  All functions insert rows into the `notifications` table directly.
// ─────────────────────────────────────────────────────────────────────────────
import { query } from '@/lib/db';

// ── low-level helper ─────────────────────────────────────────────────────────

async function createNotification(data: {
  user_id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications
         (user_id, type, title, message, action_url, priority, is_read, created_at)
       VALUES (?, ?::notification_type, ?, ?, ?, ?, FALSE, NOW())`,
      [
        data.user_id,
        data.type,
        data.title,
        data.message,
        data.action_url ?? null,
        data.priority ?? 'medium',
      ]
    );
  } catch (err) {
    // Notifications must never crash the main request
    console.error('Notification insert failed:', err);
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Notify viva coordinator(s) that a candidate has uploaded a thesis.
 */
export async function notifyThesisUploaded(
  candidateId: number,
  coordinatorIds: number[]
): Promise<void> {
  const rows = await query<any[]>(
    `SELECT pc.registration_number,
            CONCAT(st.first_name, ' ', st.last_name) AS candidate_name
     FROM phd_candidates pc
     JOIN students st ON pc.registration_number = st.registration_number
     WHERE pc.id = ?
     LIMIT 1`,
    [candidateId]
  );
  if (!rows.length) return;
  const { registration_number, candidate_name } = rows[0];

  await Promise.all(
    coordinatorIds.map((uid) =>
      createNotification({
        user_id: uid,
        type: 'thesis_uploaded',
        title: 'Thesis Uploaded',
        message: `${candidate_name} (${registration_number}) has uploaded a new thesis version.`,
        action_url: `/phd/candidates/${candidateId}`,
        priority: 'medium',
      })
    )
  );
}

/**
 * Notify candidate, supervisor, and all assigned examiners that a viva has been scheduled.
 */
export async function notifyVivaScheduled(vivaId: number): Promise<void> {
  const rows = await query<any[]>(
    `SELECT
       vs.scheduled_date, vs.scheduled_time, vs.venue,
       pc.id AS candidate_id,
       (SELECT u.id FROM users u JOIN students s ON u.email = s.email WHERE s.registration_number = pc.registration_number LIMIT 1) AS candidate_user_id,
       CONCAT(st.first_name, ' ', st.last_name) AS candidate_name,
       pc.supervisor_id,
       ve.examiner_id
     FROM viva_schedules vs
     JOIN phd_candidates pc ON vs.candidate_id = pc.id
     JOIN students st ON pc.registration_number = st.registration_number
     LEFT JOIN viva_examiners ve ON ve.viva_id = vs.id
     WHERE vs.id = ?`,
    [vivaId]
  );
  if (!rows.length) return;

  const first = rows[0];
  const dateStr = new Date(first.scheduled_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const title = 'Viva Scheduled';
  const message = `Your viva has been scheduled for ${dateStr} at ${first.venue}.`;
  const actionUrl = `/phd/schedules/${vivaId}`;

  const recipients = new Set<number>();
  if (first.candidate_user_id) recipients.add(first.candidate_user_id);
  if (first.supervisor_id) recipients.add(first.supervisor_id);
  rows.forEach((r) => { if (r.examiner_id) recipients.add(r.examiner_id); });

  await Promise.all(
    [...recipients].map((uid) =>
      createNotification({ user_id: uid, type: 'viva_scheduled', title, message, action_url: actionUrl, priority: 'high' })
    )
  );
}

/**
 * Notify a specific examiner that they have been assigned to a viva panel.
 */
export async function notifyExaminerAssigned(
  vivaId: number,
  examinerId: number
): Promise<void> {
  const rows = await query<any[]>(
    `SELECT vs.scheduled_date, vs.venue,
            CONCAT(st.first_name, ' ', st.last_name) AS candidate_name
     FROM viva_schedules vs
     JOIN phd_candidates pc ON vs.candidate_id = pc.id
     JOIN students st ON pc.registration_number = st.registration_number
     WHERE vs.id = ?
     LIMIT 1`,
    [vivaId]
  );
  if (!rows.length) return;
  const { scheduled_date, venue, candidate_name } = rows[0];
  const dateStr = new Date(scheduled_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  await createNotification({
    user_id: examinerId,
    type: 'examiner_assigned',
    title: 'You have been assigned to a Viva Panel',
    message: `You have been assigned to examine ${candidate_name}'s viva on ${dateStr} at ${venue}.`,
    action_url: `/phd/evaluations/${vivaId}`,
    priority: 'high',
  });
}

/**
 * Notify candidate and supervisor of the viva result / recommendation.
 */
export async function notifyVivaResult(vivaId: number): Promise<void> {
  const rows = await query<any[]>(
    `SELECT
       (SELECT u.id FROM users u JOIN students s ON u.email = s.email WHERE s.registration_number = pc.registration_number LIMIT 1) AS candidate_user_id,
       pc.supervisor_id,
       CONCAT(st.first_name, ' ', st.last_name) AS candidate_name,
       vr.outcome
     FROM viva_schedules vs
     JOIN phd_candidates pc ON vs.candidate_id = pc.id
     JOIN students st ON pc.registration_number = st.registration_number
     LEFT JOIN viva_recommendations vr ON vr.viva_id = vs.id
     WHERE vs.id = ?
     LIMIT 1`,
    [vivaId]
  );
  if (!rows.length) return;
  const { candidate_user_id, supervisor_id, candidate_name, outcome } = rows[0];

  const outcomeLabel: Record<string, string> = {
    pass: 'Pass',
    pass_with_minor_corrections: 'Pass — Minor Corrections',
    pass_with_major_corrections: 'Pass — Major Corrections',
    fail: 'Fail',
  };
  const label = outcomeLabel[outcome] ?? outcome;
  const title = 'Viva Result Issued';
  const message = `The panel recommendation for ${candidate_name}'s viva has been issued: ${label}.`;
  const actionUrl = `/phd/report/${vivaId}`;

  const recipients: number[] = [];
  if (candidate_user_id) recipients.push(candidate_user_id);
  if (supervisor_id) recipients.push(supervisor_id);

  await Promise.all(
    recipients.map((uid) =>
      createNotification({ user_id: uid, type: 'viva_result', title, message, action_url: actionUrl, priority: 'high' })
    )
  );
}
