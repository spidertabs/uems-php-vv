/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
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
    } = body;

    if (!viva_id || !examiner_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check viva exists
    const viva = await query<any[]>(
      'SELECT id FROM viva_schedules WHERE id = ?',
      [viva_id]
    );

    if (!viva || viva.length === 0) {
      return NextResponse.json(
        { error: 'Viva not found' },
        { status: 404 }
      );
    }

    // Check examiner exists and is assigned to this viva
    const examiner = await query<any[]>(
      `SELECT id FROM viva_examiners WHERE viva_id = ? AND examiner_id = ?`,
      [viva_id, examiner_id]
    );

    if (!examiner || examiner.length === 0) {
      return NextResponse.json(
        { error: 'Examiner not found for this viva' },
        { status: 404 }
      );
    }

    // UPSERT evaluation (insert or update based on viva_id + examiner_id combination)
    const existing = await query<any[]>(
      `SELECT id FROM viva_evaluations WHERE viva_id = ? AND examiner_id = ?`,
      [viva_id, examiner_id]
    );

    let result;
    if (existing && existing.length > 0) {
      // Update existing evaluation
      await query(
        `UPDATE viva_evaluations SET 
         originality_score = COALESCE(?, originality_score),
         methodology_score = COALESCE(?, methodology_score),
         presentation_score = COALESCE(?, presentation_score),
         literature_score = COALESCE(?, literature_score),
         strengths = COALESCE(?, strengths),
         weaknesses = COALESCE(?, weaknesses),
         recommended_corrections = COALESCE(?, recommended_corrections),
         general_comments = COALESCE(?, general_comments),
         updated_at = NOW()
         WHERE viva_id = ? AND examiner_id = ?`,
        [
          originality_score, methodology_score, presentation_score, literature_score,
          strengths, weaknesses, recommended_corrections, general_comments,
          viva_id, examiner_id
        ]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Insert new evaluation (draft)
      const insertResult = await query<any>(
        `INSERT INTO viva_evaluations 
         (viva_id, examiner_id, originality_score, methodology_score, 
          presentation_score, literature_score, strengths, weaknesses, 
          recommended_corrections, general_comments, is_submitted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW(), NOW())`,
        [
          viva_id, examiner_id, originality_score, methodology_score,
          presentation_score, literature_score, strengths, weaknesses,
          recommended_corrections, general_comments
        ]
      );
      result = { id: (insertResult as any).insertId, created: true };
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
      [user.id, existing && existing.length > 0 ? 'UPDATE' : 'CREATE', 'viva_evaluations', result.id, JSON.stringify(body)]
    );

    return NextResponse.json(result, { status: existing && existing.length > 0 ? 200 : 201 });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to save evaluation' },
      { status: 500 }
    );
  }
}
