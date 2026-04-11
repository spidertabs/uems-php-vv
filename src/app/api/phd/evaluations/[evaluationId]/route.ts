/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { evaluationId: evaluationIdStr } = await context.params;
    const evaluationId = parseInt(evaluationIdStr);
    const body = await req.json();

    // Check evaluation exists and is not submitted
    const evaluation = await query<any[]>(
      `SELECT id, is_submitted FROM viva_evaluations WHERE id = ?`,
      [evaluationId]
    );

    if (!evaluation || evaluation.length === 0) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    if (evaluation[0].is_submitted) {
      return NextResponse.json(
        { error: 'Cannot edit a submitted evaluation' },
        { status: 400 }
      );
    }

    const allowedFields = [
      'originality_score',
      'methodology_score',
      'presentation_score',
      'literature_score',
      'strengths',
      'weaknesses',
      'recommended_corrections',
      'general_comments',
    ];

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value as string | number | null);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validate scores if provided (0-25 each)
    for (const field of ['originality_score', 'methodology_score', 'presentation_score', 'literature_score']) {
      if (body[field] !== undefined && body[field] !== null) {
        if (typeof body[field] !== 'number' || body[field] < 0 || body[field] > 25) {
          return NextResponse.json(
            { error: `${field} must be between 0 and 25` },
            { status: 400 }
          );
        }
      }
    }

    updates.push('updated_at = NOW()');
    values.push(evaluationId);

    await query(
      `UPDATE viva_evaluations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, changes, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [user.id, 'UPDATE', 'viva_evaluations', evaluationId, JSON.stringify(body)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
}
