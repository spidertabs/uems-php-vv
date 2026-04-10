// ============================================================
// src/app/api/notifications/[id]/read/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// PUT /api/notifications/[id]/read - Mark a notification as read
export async function PUT(
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
        { error: 'You can only mark your own notifications as read' },
        { status: 403 }
      );
    }

    // Mark as read
    await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE id = ?`,
      [notificationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}