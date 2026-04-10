/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/notifications - Get all notifications for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await query<any[]>(
      `SELECT 
        id,
        type,
        title,
        message,
        priority,
        is_read,
        read_at,
        created_at,
        related_paper_id,
        action_url
      FROM notifications
      WHERE user_id = ?
        AND archived_at IS NULL
      ORDER BY 
        is_read ASC,
        priority DESC,
        created_at DESC
      LIMIT 100`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: notifications || [],
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}