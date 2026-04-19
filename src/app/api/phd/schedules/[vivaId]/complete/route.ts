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

    // Update schedule status to completed
    await query(
      `UPDATE viva_schedules SET status = 'completed', updated_at = NOW() WHERE id = ?`,
      [vivaId]
    );

    // Trigger trg_candidate_status_on_viva_complete will fire and update candidate status

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
      [user.id, 'UPDATE', 'viva_schedules', vivaId, JSON.stringify({ status: 'completed' })]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to complete schedule' },
      { status: 500 }
    );
  }
}
