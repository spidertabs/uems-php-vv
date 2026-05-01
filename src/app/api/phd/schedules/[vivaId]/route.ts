/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/phd/schedules/[vivaId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
// audit logging done via direct query to avoid missing VIVA_SCHEDULE entity constant

// ── helpers ──────────────────────────────────────────────────────────────────

async function buildVivaDetail(vivaId: number): Promise<any | null> {
  // ① Core schedule + candidate/programme fields
  let schedRows: any[];
  try {
    schedRows = await query<any[]>(
      `SELECT
         vs.id, vs.candidate_id, vs.thesis_id, vs.scheduled_date,
         vs.scheduled_time, vs.venue, vs.duration_minutes, vs.status,
         vs.postponement_reason, vs.created_at, vs.updated_at,
         pc.registration_number, pc.thesis_title,
         COALESCE(CONCAT(st.first_name, ' ', st.last_name), pc.registration_number) AS candidate_name,
         p.name AS programme_name, p.code AS programme_code,
         CONCAT(sup.first_name, ' ', sup.last_name) AS supervisor_name
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       LEFT JOIN students st ON pc.registration_number = st.registration_number
       JOIN programmes p ON pc.programme_id = p.id
       LEFT JOIN staff sup ON pc.supervisor_id = sup.id
       WHERE vs.id = ? AND pc.deleted_at IS NULL
       LIMIT 1`,
      [vivaId]
    );
  } catch (err) {
    console.error(`[buildVivaDetail] ① core schedule query failed for vivaId=${vivaId}:`, err);
    throw err;
  }
  if (!schedRows.length) {
    console.warn(`[buildVivaDetail] No viva schedule rows for vivaId=${vivaId}`);
    return null;
  }
  console.log(`[buildVivaDetail] Found viva schedule for vivaId=${vivaId}, candidate_id=${schedRows[0].candidate_id}`);
  const viva = { ...schedRows[0] };

  // ② Examiners panel
  try {
    viva.examiners = await query<any[]>(
      `SELECT ve.*, 
              CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
              u.email AS examiner_email
       FROM viva_examiners ve
       LEFT JOIN staff u ON ve.examiner_id = u.id
       WHERE ve.viva_id = ?
       ORDER BY ve.panel_slot ASC`,
      [vivaId]
    );
  } catch (err) {
    console.error(`[buildVivaDetail] ② examiners query failed for vivaId=${vivaId}:`, err);
    viva.examiners = [];
  }

  // ③ Evaluations
  try {
    viva.evaluations = await query<any[]>(
      `SELECT ev.*,
              CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
              ve.role AS examiner_panel_role
       FROM viva_evaluations ev
       LEFT JOIN staff u ON ev.examiner_id = u.id
       LEFT JOIN viva_examiners ve ON (ve.viva_id = ev.viva_id AND ve.examiner_id = ev.examiner_id)
       WHERE ev.viva_id = ?
       ORDER BY ev.submitted_at DESC NULLS LAST, ev.id DESC`,
      [vivaId]
    );
  } catch (err) {
    console.error(`[buildVivaDetail] ③ evaluations query failed for vivaId=${vivaId}:`, err);
    viva.evaluations = [];
  }

  // ③.b Supervisors (to add to expected evaluators)
  try {
    viva.supervisors = await query<any[]>(
      `SELECT DISTINCT u.id as supervisor_id, u.id as user_id, CONCAT(u.first_name, ' ', u.last_name) as supervisor_name, u.email as supervisor_email, 'supervisor' as role
       FROM phd_candidates pc
       JOIN staff u ON (pc.supervisor_id = u.id OR pc.co_supervisor_id = u.id)
       WHERE pc.id = ?
       UNION
       SELECT pcs.supervisor_id as supervisor_id, u.id as user_id, CONCAT(u.first_name, ' ', u.last_name) as supervisor_name, u.email as supervisor_email, pcs.role as role
       FROM phd_candidate_supervisors pcs
       JOIN staff u ON pcs.supervisor_id = u.id
       WHERE pcs.candidate_id = ?`,
      [viva.candidate_id, viva.candidate_id]
    );
  } catch (err) {
    console.error(`[buildVivaDetail] ③.b supervisors query failed for candidateId=${viva.candidate_id}:`, err);
    viva.supervisors = [];
  }

  // ④ Recommendation (or null)
  try {
    const recRows = await query<any[]>(
      'SELECT * FROM viva_recommendations WHERE viva_id = ? LIMIT 1',
      [vivaId]
    );
    viva.recommendation = recRows.length > 0 ? recRows[0] : null;
  } catch (err) {
    console.error(`[buildVivaDetail] ④ recommendation query failed for vivaId=${vivaId}:`, err);
    viva.recommendation = null;
  }

  // ⑤ Evaluation summary (averages)
  try {
    const summaryRows = await query<any[]>(
      `SELECT
         COUNT(*) AS total_examiners,
         SUM(CASE WHEN is_submitted THEN 1 ELSE 0 END) AS submitted_count,
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
  } catch (err) {
    console.error(`[buildVivaDetail] ⑤ summary query failed for vivaId=${vivaId}:`, err);
    viva.evaluation_summary = null;
  }

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

    // Allowed: coordinator, admin, hod, dean + assigned examiners (lecturer, professor, external_examiner)
    const allowedRoles = ['viva_coordinator', 'admin', 'hod', 'dean', 'lecturer', 'professor', 'external_examiner'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    if (isNaN(vivaId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const viva = await buildVivaDetail(vivaId);
    if (!viva) return NextResponse.json({ error: 'Viva not found' }, { status: 404 });

    // Restrict visibility for evaluators: "view his only"
    const evaluatorRoles = ['lecturer', 'professor', 'external_examiner'];
    if (evaluatorRoles.includes(user.role)) {
      // 1. Only show their own evaluation
      viva.evaluations = (viva.evaluations || []).filter(
        (ev: any) => Number(ev.examiner_id) === Number(user.id)
      );
      
      // 2. Hide the averages summary to ensure strict data isolation
      viva.evaluation_summary = null;
    }

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
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
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
