/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { query } from '@/lib/db';

/**
 * POST /api/phd/my-evaluations
 * Upsert a draft evaluation for an assigned candidate's viva.
 * The caller must be an assigned examiner OR a supervisor of the candidate.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // viva_coordinator can also save evaluations on behalf of others; lecturers/hods use the permission check
    const isCoordinator = ['viva_coordinator', 'admin'].includes(user.role);
    if (!isCoordinator && !hasPermission(user, 'add_candidate_evaluations')) {
      return NextResponse.json({ error: 'Forbidden – you do not have permission to submit evaluations' }, { status: 403 });
    }

    const body = await req.json();
    const {
      viva_id,
      originality_score,
      methodology_score,
      presentation_score,
      literature_score,
      strengths,
      weaknesses,
      recommended_corrections,
      general_comments,
    } = body;

    if (!viva_id) {
      return NextResponse.json({ error: 'Missing viva_id' }, { status: 400 });
    }

    // Validate scores if provided (0-25 each)
    const scores = [originality_score, methodology_score, presentation_score, literature_score];
    for (const score of scores) {
      if (score !== undefined && score !== null) {
        if (typeof score !== 'number' || score < 0 || score > 25) {
          return NextResponse.json(
            { error: 'Each score must be between 0 and 25' },
            { status: 400 }
          );
        }
      }
    }

    // ── Authorization: verify the user is assigned as examiner OR supervisor ──
    // We do this in two separate queries to avoid any missing-table failures.
    let isAuthorized = isCoordinator; // coordinators/admins bypass the check

    if (!isAuthorized) {
      // Check 1: assigned as formal examiner
      try {
        const examinerRows = await query<any[]>(
          `SELECT 1 FROM viva_examiners ve
           JOIN viva_schedules vs ON ve.viva_id = vs.id
           WHERE vs.id = ? AND ve.examiner_id = ?
           LIMIT 1`,
          [viva_id, user.id]
        );
        if (examinerRows.length > 0) isAuthorized = true;
      } catch (err) {
        console.error('[my-evaluations] examiner check failed:', err);
      }
    }

    if (!isAuthorized) {
      // Check 2: primary or co-supervisor on the candidate
      try {
        const supervisorRows = await query<any[]>(
          `SELECT 1 FROM viva_schedules vs
           JOIN phd_candidates pc ON vs.candidate_id = pc.id
           WHERE vs.id = ? AND (pc.supervisor_id = ? OR pc.co_supervisor_id = ?)
           LIMIT 1`,
          [viva_id, user.id, user.id]
        );
        if (supervisorRows.length > 0) isAuthorized = true;
      } catch (err) {
        console.error('[my-evaluations] supervisor check failed:', err);
      }
    }

    if (!isAuthorized) {
      // Check 3: supervisor in the phd_candidate_supervisors join table (if it exists)
      try {
        const extraSupRows = await query<any[]>(
          `SELECT 1 FROM phd_candidate_supervisors pcs
           JOIN viva_schedules vs ON vs.candidate_id = pcs.candidate_id
           WHERE vs.id = ? AND pcs.supervisor_id = ?
           LIMIT 1`,
          [viva_id, user.id]
        );
        if (extraSupRows.length > 0) isAuthorized = true;
      } catch (_err) {
        // Table may not exist – silently ignore
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You are not assigned as an examiner or supervisor for this viva' },
        { status: 403 }
      );
    }

    // ── UPSERT evaluation ──────────────────────────────────────────────────────
    const existing = await query<any[]>(
      `SELECT id FROM viva_evaluations WHERE viva_id = ? AND examiner_id = ?`,
      [viva_id, user.id]
    );

    let result: { id: number | null; message: string };

    if (existing && existing.length > 0) {
      // Update existing draft
      await query(
        `UPDATE viva_evaluations SET
          originality_score = ?,
          methodology_score = ?,
          presentation_score = ?,
          literature_score = ?,
          strengths = ?,
          weaknesses = ?,
          recommended_corrections = ?,
          general_comments = ?
         WHERE viva_id = ? AND examiner_id = ?`,
        [
          originality_score ?? null,
          methodology_score ?? null,
          presentation_score ?? null,
          literature_score ?? null,
          strengths ?? null,
          weaknesses ?? null,
          recommended_corrections ?? null,
          general_comments ?? null,
          viva_id,
          user.id,
        ]
      );
      result = { id: existing[0].id, message: 'Evaluation saved as draft' };
    } else {
      // Insert new draft
      const insertResult = await query<any>(
        `INSERT INTO viva_evaluations (
          viva_id, examiner_id,
          originality_score, methodology_score, presentation_score, literature_score,
          strengths, weaknesses, recommended_corrections, general_comments,
          is_submitted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [
          viva_id,
          user.id,
          originality_score ?? null,
          methodology_score ?? null,
          presentation_score ?? null,
          literature_score ?? null,
          strengths ?? null,
          weaknesses ?? null,
          recommended_corrections ?? null,
          general_comments ?? null,
        ]
      );
      result = { id: insertResult.insertId, message: 'Evaluation created as draft' };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[my-evaluations] POST error:', error);
    // Return the real error message so we can debug in the UI
    return NextResponse.json(
      { error: error?.message || 'Failed to create evaluation' },
      { status: 500 }
    );
  }
}
