/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    const body = await req.json();
    const { postponement_reason } = body;

    if (!postponement_reason) {
      return NextResponse.json(
        { error: 'Postponement reason is required' },
        { status: 400 }
      );
    }

    // Get the schedule and candidate info
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

    // Update schedule status to postponed
    await query(
      `UPDATE viva_schedules SET status = 'postponed', updated_at = NOW() WHERE id = ?`,
      [vivaId]
    );

    // Note: Candidate status remains as is (not automatically changed on postponement)

    // Create notification to candidate
    const candidate = await query<any[]>(
      `SELECT pc.user_id FROM phd_candidates pc WHERE pc.id = ?`,
      [schedule[0].candidate_id]
    );

    if (candidate && candidate.length > 0) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body, related_id, created_at)
         VALUES (?, 'viva_postponed', 'Viva Postponed', ?, ?, NOW())`,
        [candidate[0].user_id, `Your viva has been postponed. Reason: ${postponement_reason}`, vivaId]
      );
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
      [user.id, 'UPDATE', 'viva_schedules', vivaId, JSON.stringify(body)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error postponing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to postpone schedule' },
      { status: 500 }
    );
  }
}
