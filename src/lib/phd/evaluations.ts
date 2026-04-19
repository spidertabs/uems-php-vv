/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/evaluations.ts
import { query } from '@/lib/db';
import type { VivaEvaluationWithExaminer, VivaEvaluationSummary } from '@/types/phd';

export async function getEvaluationsByVivaId(vivaId: number): Promise<VivaEvaluationWithExaminer[]> {
  return query<VivaEvaluationWithExaminer[]>(
    `SELECT
       ev.*,
       CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
       ve.role AS examiner_panel_role
     FROM viva_evaluations ev
     JOIN users u ON ev.examiner_id = u.id
     JOIN viva_examiners ve ON ve.viva_id = ev.viva_id AND ve.examiner_id = ev.examiner_id
     WHERE ev.viva_id = ?
     ORDER BY ev.id`,
    [vivaId]
  );
}

export async function getEvaluationByExaminer(
  vivaId: number,
  examinerId: number
): Promise<any | null> {
  const rows = await query<any[]>(
    `SELECT ev.*, CONCAT(u.first_name, ' ', u.last_name) AS examiner_name
     FROM viva_evaluations ev
     JOIN users u ON ev.examiner_id = u.id
     WHERE ev.viva_id = ? AND ev.examiner_id = ?
     LIMIT 1`,
    [vivaId, examinerId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function upsertEvaluation(data: {
  viva_id: number;
  examiner_id: number;
  originality_score?: number | null;
  methodology_score?: number | null;
  presentation_score?: number | null;
  literature_score?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  recommended_corrections?: string | null;
  general_comments?: string | null;
}): Promise<number> {
  const result = await query<any>(
    `INSERT INTO viva_evaluations
       (viva_id, examiner_id, originality_score, methodology_score,
        presentation_score, literature_score,
        strengths, weaknesses, recommended_corrections, general_comments,
        is_submitted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
     ON CONFLICT (viva_id, examiner_id) DO UPDATE SET
       originality_score        = EXCLUDED.originality_score,
       methodology_score        = EXCLUDED.methodology_score,
       presentation_score       = EXCLUDED.presentation_score,
       literature_score         = EXCLUDED.literature_score,
       strengths                = EXCLUDED.strengths,
       weaknesses               = EXCLUDED.weaknesses,
       recommended_corrections  = EXCLUDED.recommended_corrections,
       general_comments         = EXCLUDED.general_comments`,
    [
      data.viva_id, data.examiner_id,
      data.originality_score ?? null,
      data.methodology_score ?? null,
      data.presentation_score ?? null,
      data.literature_score ?? null,
      data.strengths ?? null,
      data.weaknesses ?? null,
      data.recommended_corrections ?? null,
      data.general_comments ?? null,
    ]
  );
  return result.insertId ?? result.affectedRows;
}

export async function submitEvaluation(vivaId: number, examinerId: number): Promise<void> {
  await query(
    `UPDATE viva_evaluations
     SET is_submitted = TRUE, submitted_at = NOW()
     WHERE viva_id = ? AND examiner_id = ? AND is_submitted = FALSE`,
    [vivaId, examinerId]
  );
}

export async function getEvaluationSummary(vivaId: number): Promise<VivaEvaluationSummary> {
  const rows = await query<any[]>(
    `SELECT
       ? AS viva_id,
       COUNT(*) AS total_examiners,
       SUM(is_submitted) AS submitted_count,
       AVG(CASE WHEN is_submitted THEN originality_score END)  AS avg_originality,
       AVG(CASE WHEN is_submitted THEN methodology_score END)  AS avg_methodology,
       AVG(CASE WHEN is_submitted THEN presentation_score END) AS avg_presentation,
       AVG(CASE WHEN is_submitted THEN literature_score END)   AS avg_literature,
       AVG(CASE WHEN is_submitted THEN overall_score END)      AS avg_overall
     FROM viva_evaluations
     WHERE viva_id = ?`,
    [vivaId, vivaId]
  );
  const row = rows[0];
  return {
    viva_id: vivaId,
    total_examiners: Number(row.total_examiners ?? 0),
    submitted_count: Number(row.submitted_count ?? 0),
    avg_originality: row.avg_originality !== null ? Number(row.avg_originality) : null,
    avg_methodology: row.avg_methodology !== null ? Number(row.avg_methodology) : null,
    avg_presentation: row.avg_presentation !== null ? Number(row.avg_presentation) : null,
    avg_literature: row.avg_literature !== null ? Number(row.avg_literature) : null,
    avg_overall: row.avg_overall !== null ? Number(row.avg_overall) : null,
  };
}
