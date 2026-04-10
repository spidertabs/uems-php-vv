// ============================================================
// src/app/api/notifications/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = parseInt(params.id);

    // Verify ownership
    const notification = await query<any[]>(
      `SELECT user_id FROM notifications WHERE id = ?`,
      [notificationId]
    );

    if (!notification || notification.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own notifications' },
        { status: 403 }
      );
    }

    // Soft delete by archiving
    await query(
      `UPDATE notifications SET archived_at = NOW() WHERE id = ?`,
      [notificationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}