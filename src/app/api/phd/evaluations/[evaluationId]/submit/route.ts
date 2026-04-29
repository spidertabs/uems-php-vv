// src/app/api/phd/evaluations/[evaluationId]/submit/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evaluationId: evaluationIdStr } = await context.params;
    const evaluationId = parseInt(evaluationIdStr);

    // Get evaluation with owner info
    const evaluation = await query<any[]>(
      `SELECT id, examiner_id, is_submitted, originality_score, methodology_score, 
              presentation_score, literature_score
       FROM viva_evaluations WHERE id = ?`,
      [evaluationId]
    );

    if (!evaluation || evaluation.length === 0) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    const eval_data = evaluation[0];

    // Check permission: admin/coordinator can submit any, lecturer can only submit their own
    const isOwner = eval_data.examiner_id === user.id;
    const isPrivileged = ['viva_coordinator', 'admin'].includes(user.role);

    if (!isPrivileged && !isOwner) {
      return NextResponse.json({ error: 'You are not authorized to submit this evaluation' }, { status: 403 });
    }

    // Validation: all 4 scores must be filled before submit
    if (eval_data.originality_score === null || eval_data.originality_score === undefined ||
        eval_data.methodology_score === null || eval_data.methodology_score === undefined ||
        eval_data.presentation_score === null || eval_data.presentation_score === undefined ||
        eval_data.literature_score === null || eval_data.literature_score === undefined) {
      return NextResponse.json(
        { error: 'All four scores (originality, methodology, presentation, literature) must be filled before submitting' },
        { status: 400 }
      );
    }

    if (eval_data.is_submitted) {
      return NextResponse.json(
        { error: 'This evaluation has already been submitted' },
        { status: 400 }
      );
    }

    // Submit evaluation
    await query(
      `UPDATE viva_evaluations SET is_submitted = TRUE, submitted_at = NOW()
       WHERE id = ?`,
      [evaluationId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
      [user.id, 'UPDATE', 'viva_evaluations', evaluationId, JSON.stringify({ is_submitted: true })]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[evaluations/submit] POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}
