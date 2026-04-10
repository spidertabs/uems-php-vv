/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    // Get all comments for the paper
    const comments = await query<any[]>(
      `SELECT 
        pc.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.role as user_role
      FROM paper_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.exam_paper_id = ?
      ORDER BY pc.created_at DESC`,
      [paperId]
    );

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('GET /api/exam-papers/[paperId]/comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;
    const body = await request.json();

    const { comment, comment_type = 'feedback' } = body;

    if (!comment || comment.trim() === '') {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Verify paper exists
    const paperResult = await query<any[]>(
      'SELECT id FROM exam_papers WHERE id = ?',
      [paperId]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Insert comment
    const result = await query(
      `INSERT INTO paper_comments 
       (exam_paper_id, user_id, comment_type, comment)
       VALUES (?, ?, ?, ?)`,
      [paperId, session.id, comment_type, comment]
    );

    // Get the created comment with user info
    const commentResult = await query<any[]>(
      `SELECT 
        pc.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.role as user_role
      FROM paper_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.id = ?`,
      [(result as any).insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: commentResult[0],
    });
  } catch (error) {
    console.error('POST /api/exam-papers/[paperId]/comments error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment', details: String(error) },
      { status: 500 }
    );
  }
}