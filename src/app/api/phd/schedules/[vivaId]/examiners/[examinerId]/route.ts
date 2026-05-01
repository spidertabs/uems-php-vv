/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string; examinerId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr, examinerId: examinerIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    const examinerId = parseInt(examinerIdStr);
    const body = await req.json();
    const { confirmed } = body;

    if (confirmed !== true) {
      return NextResponse.json(
        { error: 'Invalid confirmation value' },
        { status: 400 }
      );
    }

    // Get examiner assignment
    const assignment = await query<any[]>(
      `SELECT id FROM viva_examiners WHERE viva_id = ? AND examiner_id = ?`,
      [vivaId, examinerId]
    );

    if (!assignment || assignment.length === 0) {
      return NextResponse.json(
        { error: 'Examiner assignment not found' },
        { status: 404 }
      );
    }

    // Update confirmation
    await query(
      `UPDATE viva_examiners SET confirmed = TRUE, confirmed_at = NOW() 
       WHERE viva_id = ? AND examiner_id = ?`,
      [vivaId, examinerId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
      [user.id, 'UPDATE', 'viva_examiners', assignment[0].id, JSON.stringify(body)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming examiner:', error);
    return NextResponse.json(
      { error: 'Failed to confirm examiner' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string; examinerId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr, examinerId: examinerIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    const examinerId = parseInt(examinerIdStr);

    // Check viva is not completed
    const schedule = await query<any[]>(
      `SELECT status FROM viva_schedules WHERE id = ?`,
      [vivaId]
    );

    if (!schedule || schedule.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    if (schedule[0].status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot remove examiner from completed viva' },
        { status: 400 }
      );
    }

    // Get and remove examiner assignment
    const assignment = await query<any[]>(
      `SELECT id FROM viva_examiners WHERE viva_id = ? AND examiner_id = ?`,
      [vivaId, examinerId]
    );

    if (!assignment || assignment.length === 0) {
      return NextResponse.json(
        { error: 'Examiner assignment not found' },
        { status: 404 }
      );
    }

    await query(
      `DELETE FROM viva_examiners WHERE viva_id = ? AND examiner_id = ?`,
      [vivaId, examinerId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
      [user.id, 'DELETE', 'viva_examiners', assignment[0].id, JSON.stringify({ removed: true })]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing examiner:', error);
    return NextResponse.json(
      { error: 'Failed to remove examiner' },
      { status: 500 }
    );
  }
}
