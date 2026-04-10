/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/notifications/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/notifications/feedback - Get feedback for user's papers
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feedbacks = await query<any[]>(
      `SELECT 
        pc.id,
        pc.exam_paper_id,
        ep.paper_code,
        c.code as course_code,
        c.title as course_title,
        pc.comment,
        pc.comment_type,
        pc.is_resolved,
        pc.created_at,
        ep.status,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM paper_comments pc
      JOIN exam_papers ep ON pc.exam_paper_id = ep.id
      JOIN courses c ON ep.course_id = c.id
      JOIN users u ON pc.user_id = u.id
      WHERE ep.created_by = ? 
        AND ep.deleted_at IS NULL
      ORDER BY pc.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}