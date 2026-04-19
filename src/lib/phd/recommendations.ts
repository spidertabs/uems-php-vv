/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/recommendations.ts
import { query } from '@/lib/db';
import type { VivaRecommendation, VivaOutcome, VivaReportFull } from '@/types/phd';

export async function getRecommendationByVivaId(
  vivaId: number
): Promise<VivaRecommendation | null> {
  const rows = await query<VivaRecommendation[]>(
    'SELECT * FROM viva_recommendations WHERE viva_id = ? LIMIT 1',
    [vivaId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createRecommendation(data: {
  viva_id: number;
  outcome: VivaOutcome;
  correction_deadline?: string | null;
  final_comments?: string | null;
  issued_by: number;
}): Promise<number> {
  const result = await query<any>(
    `INSERT INTO viva_recommendations
       (viva_id, outcome, correction_deadline, final_comments, issued_by, issued_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      data.viva_id,
      data.outcome,
      data.correction_deadline ?? null,
      data.final_comments ?? null,
      data.issued_by,
    ]
  );
  return result.insertId;
}

export async function getFullVivaReport(vivaId: number): Promise<VivaReportFull | null> {
  try {
    // Schedule / candidate / recommendation row
    const scheduleRows = await query<any[]>(
      `SELECT
         vs.id, vs.scheduled_date, vs.scheduled_time, vs.venue,
         vs.duration_minutes, vs.status,
         pc.registration_number, pc.thesis_title,
         CONCAT(uc.first_name, ' ', uc.last_name) AS candidate_name,
         CONCAT(su.first_name, ' ', su.last_name) AS supervisor_name,
         p.name AS programme_name,
         vr.outcome, vr.correction_deadline, vr.final_comments
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       JOIN users uc ON pc.user_id = uc.id
       LEFT JOIN users su ON pc.supervisor_id = su.id
       JOIN programmes p ON pc.programme_id = p.id
       LEFT JOIN viva_recommendations vr ON vr.viva_id = vs.id
       WHERE vs.id = ?
       LIMIT 1`,
      [vivaId]
    );

    if (!scheduleRows || scheduleRows.length === 0) return null;

    // Evaluation rows
    const evaluationRows = await query<any[]>(
      `SELECT
         CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
         ve_panel.role AS examiner_role,
         ev.originality_score, ev.methodology_score,
         ev.presentation_score, ev.literature_score,
         ev.overall_score, ev.strengths, ev.weaknesses,
         ev.recommended_corrections, ev.general_comments,
         ev.submitted_at
       FROM viva_evaluations ev
       JOIN users u ON ev.examiner_id = u.id
       JOIN viva_examiners ve_panel
         ON ve_panel.viva_id = ev.viva_id AND ve_panel.examiner_id = ev.examiner_id
       WHERE ev.viva_id = ?
       ORDER BY ev.id`,
      [vivaId]
    );

    const s = scheduleRows[0];
    return {
      schedule: {
        id: s.id,
        scheduled_date: s.scheduled_date,
        scheduled_time: s.scheduled_time,
        venue: s.venue,
        duration_minutes: s.duration_minutes,
        status: s.status,
        registration_number: s.registration_number,
        thesis_title: s.thesis_title,
        candidate_name: s.candidate_name,
        supervisor_name: s.supervisor_name ?? null,
        programme_name: s.programme_name,
        outcome: s.outcome ?? null,
        correction_deadline: s.correction_deadline ?? null,
        final_comments: s.final_comments ?? null,
      },
      evaluations: (evaluationRows ?? []).map((e: any) => ({
        examiner_name: e.examiner_name,
        examiner_role: e.examiner_role,
        originality_score: e.originality_score ?? null,
        methodology_score: e.methodology_score ?? null,
        presentation_score: e.presentation_score ?? null,
        literature_score: e.literature_score ?? null,
        overall_score: e.overall_score ?? null,
        strengths: e.strengths ?? null,
        weaknesses: e.weaknesses ?? null,
        recommended_corrections: e.recommended_corrections ?? null,
        general_comments: e.general_comments ?? null,
        submitted_at: e.submitted_at ?? null,
      })),
    };
  } catch (err) {
    console.error('Error fetching full viva report:', err);
    return null;
  }
}
