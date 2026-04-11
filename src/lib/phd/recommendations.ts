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
    // Call the stored procedure — returns two result sets
    const results = await query<any[]>('CALL sp_get_viva_report(?)', [vivaId]);

    // mysql2 returns array of result sets; first element is the schedule row
    const scheduleRows: any[] = Array.isArray(results[0]) ? results[0] : [results[0]];
    const evaluationRows: any[] = Array.isArray(results[1]) ? results[1] : [];

    if (!scheduleRows || scheduleRows.length === 0) return null;

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
      evaluations: evaluationRows.map((e: any) => ({
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
    console.error('Error calling sp_get_viva_report:', err);
    return null;
  }
}
