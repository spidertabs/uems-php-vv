// src/app/api/phd/schedules/[vivaId]/evaluations/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdParam } = await context.params;
    const vivaId = parseInt(vivaIdParam);

    // Get all evaluations for this viva
    const evaluations = await query<any[]>(
      `SELECT ve.id, ve.viva_id, ve.examiner_id, 
              ve.originality_score, ve.methodology_score, 
              ve.presentation_score, ve.literature_score,
              ve.strengths, ve.weaknesses, ve.recommended_corrections, 
              ve.general_comments, ve.is_submitted, ve.submitted_at,
              u.email, u.first_name, u.last_name
       FROM viva_evaluations ve
       JOIN users u ON ve.examiner_id = u.id
       WHERE ve.viva_id = ?
       ORDER BY u.last_name`,
      [vivaId]
    );

    // Calculate summary/averages
    let evaluationSummary = null;
    if (evaluations && evaluations.length > 0) {
      const submitted = evaluations.filter((e: any) => e.is_submitted);
      
      if (submitted.length > 0) {
        const avgOriginality = submitted.reduce((sum: number, e: any) => sum + (e.originality_score || 0), 0) / submitted.length;
        const avgMethodology = submitted.reduce((sum: number, e: any) => sum + (e.methodology_score || 0), 0) / submitted.length;
        const avgPresentation = submitted.reduce((sum: number, e: any) => sum + (e.presentation_score || 0), 0) / submitted.length;
        const avgLiterature = submitted.reduce((sum: number, e: any) => sum + (e.literature_score || 0), 0) / submitted.length;

        evaluationSummary = {
          total_examiners: evaluations.length,
          submitted_evaluations: submitted.length,
          avg_originality_score: parseFloat(avgOriginality.toFixed(2)),
          avg_methodology_score: parseFloat(avgMethodology.toFixed(2)),
          avg_presentation_score: parseFloat(avgPresentation.toFixed(2)),
          avg_literature_score: parseFloat(avgLiterature.toFixed(2)),
          overall_average: parseFloat(((avgOriginality + avgMethodology + avgPresentation + avgLiterature) / 4).toFixed(2))
        };
      }
    }

    return NextResponse.json({
      evaluations,
      summary: evaluationSummary
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}