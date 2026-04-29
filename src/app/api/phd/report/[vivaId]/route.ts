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
    if (!user || !['viva_coordinator', 'admin', 'dean', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);

    // Get viva schedule details with candidate and programme info
    const scheduleResult = await query<any[]>(
      `SELECT 
         vs.id,
         vs.scheduled_date,
         vs.scheduled_time,
         vs.venue,
         vs.duration_minutes,
         vs.status,
         COALESCE(CONCAT(st.first_name, ' ', st.last_name), pc.registration_number) as candidate_name,
         pc.registration_number,
         pc.thesis_title,
         p.name as programme_name,
         p.code as programme_code,
         CONCAT(sup.first_name, ' ', sup.last_name) as supervisor_name,
         vr.outcome,
         vr.correction_deadline,
         vr.final_comments,
         vr.issued_at as recommendation_issued
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       LEFT JOIN students st ON pc.registration_number = st.registration_number
       JOIN programmes p ON pc.programme_id = p.id
       LEFT JOIN staff sup ON pc.supervisor_id = sup.id
       LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
       WHERE vs.id = ?`,
      [vivaId]
    );

    if (!scheduleResult || scheduleResult.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const schedule = scheduleResult[0];

    // Get evaluations from examiners
    const evaluationsResult = await query<any[]>(
      `SELECT 
         ve.id,
         ve.examiner_id,
         CONCAT(u.first_name, ' ', u.last_name) as examiner_name,
         u.email as examiner_email,
         vex.role as examiner_role,
         ve.originality_score,
         ve.methodology_score,
         ve.presentation_score,
         ve.literature_score,
         ve.overall_score,
         ve.strengths,
         ve.weaknesses,
         ve.recommended_corrections,
         ve.general_comments,
         ve.submitted_at
       FROM viva_evaluations ve
       JOIN staff u ON ve.examiner_id = u.id
       JOIN viva_examiners vex ON ve.viva_id = vex.viva_id AND ve.examiner_id = vex.examiner_id
       WHERE ve.viva_id = ?
       ORDER BY ve.submitted_at ASC`,
      [vivaId]
    );

    const evaluations = evaluationsResult.map(row => ({
      id: row.id,
      examiner_id: row.examiner_id,
      examiner_name: row.examiner_name,
      examiner_email: row.examiner_email,
      examiner_role: row.examiner_role,
      originality_score: row.originality_score,
      methodology_score: row.methodology_score,
      presentation_score: row.presentation_score,
      literature_score: row.literature_score,
      overall_score: row.overall_score,
      strengths: row.strengths,
      weaknesses: row.weaknesses,
      recommended_corrections: row.recommended_corrections,
      general_comments: row.general_comments,
      submitted_at: row.submitted_at,
    }));

    const report = {
      schedule,
      evaluations,
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: String(error) },
      { status: 500 }
    );
  }
}
