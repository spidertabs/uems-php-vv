/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// PUT /api/notifications/mark-all-read - Mark all as read
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all unread notifications as read
    const result = await query<any>(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE user_id = ? AND is_read = FALSE`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: `${result.affectedRows} notifications marked as read`,
      count: result.affectedRows,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}