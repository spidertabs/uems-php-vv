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

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);

    // Get viva schedule info to verify access
    const schedule = await query<any[]>(
      `SELECT vs.id, vs.candidate_id, pc.supervisor_id
       FROM viva_schedules vs
       JOIN phd_candidates pc ON vs.candidate_id = pc.id
       WHERE vs.id = ?`,
      [vivaId]
    );

    if (!schedule || schedule.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Check access: only coordinator, admin, hod, or the candidate's supervisor
    const isSupervisor = schedule[0].supervisor_id === user.id;
    const hasAccess = user.role === 'admin' || user.role === 'hod' || isSupervisor;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this report' },
        { status: 403 }
      );
    }

    // Call stored procedure sp_get_viva_report
    const report = await query<any>(
      `CALL sp_get_viva_report(?)`,
      [vivaId]
    );

    // The stored procedure returns multiple result sets
    // First result set: schedule details, second result set: evaluations
    const scheduleInfo = report[0] || [];
    const evaluations = report[1] || [];

    return NextResponse.json({
      schedule: scheduleInfo.length > 0 ? scheduleInfo[0] : null,
      evaluations: evaluations
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
