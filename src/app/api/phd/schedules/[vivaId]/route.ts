/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/phd/schedules/[vivaId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
// audit logging done via direct query to avoid missing VIVA_SCHEDULE entity constant

// ── helpers ──────────────────────────────────────────────────────────────────

async function buildVivaDetail(vivaId: number): Promise<any | null> {
  // ① Core schedule + candidate/programme fields
  const schedRows = await query<any[]>(
    `SELECT
       vs.id, vs.candidate_id, vs.thesis_id, vs.scheduled_date,
       vs.scheduled_time, vs.venue, vs.duration_minutes, vs.status,
       vs.postponement_reason, vs.created_at, vs.updated_at,
       pc.registration_number, pc.thesis_title,
       CONCAT(uc.first_name, ' ', uc.last_name) AS candidate_name,
       p.name AS programme_name,
       CONCAT(s.first_name, ' ', s.last_name) AS supervisor_name
     FROM viva_schedules vs
     JOIN phd_candidates pc ON vs.candidate_id = pc.id
     JOIN users uc ON pc.user_id = uc.id
     JOIN programmes p ON pc.programme_id = p.id
     LEFT JOIN users s ON pc.supervisor_id = s.id
     WHERE vs.id = ?
     LIMIT 1`,
    [vivaId]
  );
  if (!schedRows.length) return null;
  const viva = { ...schedRows[0] };

  // ② Examiners panel
  viva.examiners = await query<any[]>(
    `SELECT ve.id, ve.viva_id, ve.examiner_id, ve.role,
            ve.confirmed, ve.confirmed_at, ve.notified_at,
            CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
            u.email AS examiner_email
     FROM viva_examiners ve
     JOIN users u ON ve.examiner_id = u.id
     WHERE ve.viva_id = ?
     ORDER BY ve.id`,
    [vivaId]
  );

  // ③ Evaluations (one per examiner, joined with panel role)
  viva.evaluations = await query<any[]>(
    `SELECT ev.id, ev.viva_id, ev.examiner_id,
            ev.originality_score, ev.methodology_score,
            ev.presentation_score, ev.literature_score, ev.overall_score,
            ev.strengths, ev.weaknesses, ev.recommended_corrections,
            ev.general_comments, ev.is_submitted, ev.submitted_at,
            CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
            ve.role AS examiner_panel_role
     FROM viva_evaluations ev
     JOIN users u ON ev.examiner_id = u.id
     JOIN viva_examiners ve ON ve.viva_id = ev.viva_id AND ve.examiner_id = ev.examiner_id
     WHERE ev.viva_id = ?
     ORDER BY ev.id`,
    [vivaId]
  );

  // ④ Recommendation (or null)
  const recRows = await query<any[]>(
    'SELECT * FROM viva_recommendations WHERE viva_id = ? LIMIT 1',
    [vivaId]
  );
  viva.recommendation = recRows.length > 0 ? recRows[0] : null;

  // ⑤ Evaluation summary (averages)
  const summaryRows = await query<any[]>(
    `SELECT
       COUNT(*) AS total_examiners,
       SUM(is_submitted) AS submitted_count,
       AVG(CASE WHEN is_submitted THEN originality_score END)  AS avg_originality,
       AVG(CASE WHEN is_submitted THEN methodology_score END)  AS avg_methodology,
       AVG(CASE WHEN is_submitted THEN presentation_score END) AS avg_presentation,
       AVG(CASE WHEN is_submitted THEN literature_score END)   AS avg_literature,
       AVG(CASE WHEN is_submitted THEN overall_score END)      AS avg_overall
     FROM viva_evaluations
     WHERE viva_id = ?`,
    [vivaId]
  );
  const sr = summaryRows[0] ?? {};
  viva.evaluation_summary = {
    viva_id: vivaId,
    total_examiners: Number(sr.total_examiners ?? 0),
    submitted_count: Number(sr.submitted_count ?? 0),
    avg_originality: sr.avg_originality !== null ? Number(sr.avg_originality) : null,
    avg_methodology: sr.avg_methodology !== null ? Number(sr.avg_methodology) : null,
    avg_presentation: sr.avg_presentation !== null ? Number(sr.avg_presentation) : null,
    avg_literature: sr.avg_literature !== null ? Number(sr.avg_literature) : null,
    avg_overall: sr.avg_overall !== null ? Number(sr.avg_overall) : null,
  };

  return viva;
}

// ── GET /api/phd/schedules/[vivaId] ──────────────────────────────────────────

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Allowed: coordinator, admin, hod, dean + assigned examiners
    const allowedRoles = ['viva_coordinator', 'admin', 'hod', 'dean', 'lecturer'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    if (isNaN(vivaId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const viva = await buildVivaDetail(vivaId);
    if (!viva) return NextResponse.json({ error: 'Viva not found' }, { status: 404 });

    return NextResponse.json({ viva });
  } catch (error) {
    console.error('Error fetching viva detail:', error);
    return NextResponse.json({ error: 'Failed to fetch viva detail' }, { status: 500 });
  }
}

// ── PUT /api/phd/schedules/[vivaId] ──────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    const body = await req.json();

    const allowedFields = ['scheduled_date', 'scheduled_time', 'venue', 'duration_minutes'];
    const updates: string[] = [];
    const values: (string | number)[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value as string | number);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(vivaId);

    await query(
      `UPDATE viva_schedules SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at)
       VALUES (?, 'UPDATE', 'viva_schedules', ?, ?, NOW())`,
      [user.id, vivaId, JSON.stringify(body)]
    );

    const updated = await buildVivaDetail(vivaId);
    return NextResponse.json({ viva: updated });
  } catch (error) {
    console.error('Error updating viva schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}
