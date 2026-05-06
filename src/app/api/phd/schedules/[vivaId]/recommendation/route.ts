/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifyVivaResult } from '@/lib/phd/notifications';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod', 'dean', 'lecturer', 'professor', 'external_examiner'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);

    const recommendation = await query<any[]>(
      `SELECT id, viva_id, outcome, correction_deadline, final_comments, issued_by, issued_at
       FROM viva_recommendations
       WHERE viva_id = ?`,
      [vivaId]
    );

    if (!recommendation || recommendation.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(recommendation[0]);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendation' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod', 'dean'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    const body = await req.json();
    const { outcome, correction_deadline, final_comments } = body;

    if (!outcome) {
      return NextResponse.json(
        { error: 'Outcome is required' },
        { status: 400 }
      );
    }

    const validOutcomes = ['pass', 'pass_with_minor_corrections', 'pass_with_major_corrections', 'fail'];
    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome' },
        { status: 400 }
      );
    }

    // Validation: correction_deadline required if outcome != 'pass'
    if (outcome !== 'pass' && outcome !== 'fail' && !correction_deadline) {
      return NextResponse.json(
        { error: 'Correction deadline is required for this outcome' },
        { status: 400 }
      );
    }

    // Get viva to access candidate
    const schedule = await query<any[]>(
      `SELECT vs.id, vs.candidate_id FROM viva_schedules vs WHERE vs.id = ?`,
      [vivaId]
    );

    if (!schedule || schedule.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const candidateId = schedule[0].candidate_id;

    // Validation: all examiners must have submitted evaluations
    const examiners = await query<any[]>(
      `SELECT COUNT(*) as total FROM viva_examiners WHERE viva_id = ?`,
      [vivaId]
    );

    const submitted = await query<any[]>(
      `SELECT COUNT(*) as count FROM viva_evaluations WHERE viva_id = ? AND is_submitted = TRUE`,
      [vivaId]
    );

    if (examiners && examiners[0].total > 0 && submitted && submitted[0].count !== examiners[0].total) {
      return NextResponse.json(
        { error: 'All examiners must have submitted their evaluations before creating a recommendation' },
        { status: 400 }
      );
    }

    // Check if recommendation already exists
    const existing = await query<any[]>(
      `SELECT id FROM viva_recommendations WHERE viva_id = ?`,
      [vivaId]
    );

    let result;
    if (existing && existing.length > 0) {
      // Update existing
      await query(
        `UPDATE viva_recommendations SET 
         outcome = ?, correction_deadline = ?, final_comments = ?, issued_by = ?, issued_at = NOW()
         WHERE viva_id = ?`,
        [outcome, correction_deadline || null, final_comments || null, user.id, vivaId]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Create new
      const insertResult = await query<any>(
        `INSERT INTO viva_recommendations (viva_id, outcome, correction_deadline, final_comments, issued_by, issued_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [vivaId, outcome, correction_deadline || null, final_comments || null, user.id]
      );
      result = { id: (insertResult as any).insertId, created: true };
    }

    // Update candidate status based on outcome
    let newStatus = 'viva_completed';
    if (outcome === 'pass_with_minor_corrections' || outcome === 'pass_with_major_corrections') {
      newStatus = 'corrections_pending';
    }

    await query(
      `UPDATE phd_candidates SET status = ?::candidate_status, updated_at = NOW() WHERE id = ?`,
      [newStatus, candidateId]
    );

    // Notify candidate + supervisor via centralised helper
    await notifyVivaResult(vivaId);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
       VALUES (?, ?, 'viva_recommendations', ?, ?, NOW())`,
      [
        user.id,
        existing && existing.length > 0 ? 'UPDATE' : 'CREATE',
        result.id,
        JSON.stringify({ outcome, correction_deadline, final_comments }),
      ]
    );

    return NextResponse.json(result, { status: existing && existing.length > 0 ? 200 : 201 });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}
