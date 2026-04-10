// ============================================================
// src/app/api/paper-comments/[id]/resolve/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// PUT /api/paper-comments/[id]/resolve - Mark comment as resolved
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = parseInt(params.id);

    // Verify the comment exists and user has permission
    const comment = await query<any[]>(
      `SELECT pc.*, ep.created_by 
       FROM paper_comments pc
       JOIN exam_papers ep ON pc.exam_paper_id = ep.id
       WHERE pc.id = ?`,
      [commentId]
    );

    if (!comment || comment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Only paper creator can resolve comments on their paper
    if (comment[0].created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only resolve comments on your own papers' },
        { status: 403 }
      );
    }

    // Mark as resolved
    await query(
      `UPDATE paper_comments SET is_resolved = TRUE WHERE id = ?`,
      [commentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Comment marked as resolved',
    });
  } catch (error) {
    console.error('Error resolving comment:', error);
    return NextResponse.json(
      { error: 'Failed to resolve comment' },
      { status: 500 }
    );
  }
}
