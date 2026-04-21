/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { query } from '@/lib/db';

/**
 * POST /api/phd/my-evaluations/new
 * Create a new evaluation for an assigned candidate's viva
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(user, 'add_candidate_evaluations')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      return NextResponse.json(
        { error: 'Missing viva_id' },
        { status: 400 }
      );
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

    // Verify viva exists and belongs to candidate supervised by this lecturer
    const vivaCheck = await query<any[]>(
      `SELECT vs.id, vs.candidate_id, pc.supervisor_id, pc.co_supervisor_id
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       WHERE vs.id = ?`,
      [viva_id]
    );

    if (!vivaCheck || vivaCheck.length === 0) {
      return NextResponse.json(
        { error: 'Viva not found' },
        { status: 404 }
      );
    }

    const viva = vivaCheck[0];
    // Verify lecturer is supervisor/co-supervisor
    if (viva.supervisor_id !== user.id && viva.co_supervisor_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to evaluate this candidate' },
        { status: 403 }
      );
    }

    // Check examiner exists and is assigned to this viva
    const examinerCheck = await query<any[]>(
      `SELECT id FROM viva_examiners WHERE viva_id = ? AND examiner_id = ?`,
      [viva_id, user.id]
    );

    if (!examinerCheck || examinerCheck.length === 0) {
      return NextResponse.json(
        { error: 'You are not assigned as an examiner for this viva' },
        { status: 403 }
      );
    }

    // UPSERT evaluation
    const existing = await query<any[]>(
      `SELECT id FROM viva_evaluations WHERE viva_id = ? AND examiner_id = ?`,
      [viva_id, user.id]
    );

    let result;
    if (existing && existing.length > 0) {
      // Update existing
      await query(
        `UPDATE viva_evaluations SET
          originality_score = ?,
          methodology_score = ?,
          presentation_score = ?,
          literature_score = ?,
          strengths = ?,
          weaknesses = ?,
          recommended_corrections = ?,
          general_comments = ?,
          updated_at = NOW()
        WHERE viva_id = ? AND examiner_id = ?`,
        [
          originality_score,
          methodology_score,
          presentation_score,
          literature_score,
          strengths,
          weaknesses,
          recommended_corrections,
          general_comments,
          viva_id,
          user.id,
        ]
      );
      result = { id: existing[0].id, message: 'Evaluation updated' };
    } else {
      // Insert new
      const insertResult = await query(
        `INSERT INTO viva_evaluations (
          viva_id,
          examiner_id,
          originality_score,
          methodology_score,
          presentation_score,
          literature_score,
          strengths,
          weaknesses,
          recommended_corrections,
          general_comments,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          viva_id,
          user.id,
          originality_score,
          methodology_score,
          presentation_score,
          literature_score,
          strengths,
          weaknesses,
          recommended_corrections,
          general_comments,
        ]
      );
      result = { id: (insertResult as any).insertId, message: 'Evaluation created' };
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
}
