/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[id]/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Generic query helper
async function query<T>(sql: string, params: any[] = []): Promise<T> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; questionId: string } | Promise<{ id: string; questionId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.id;
    const questionId = resolvedParams.questionId;

    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Removing question from paper:', { paperId, questionId });

    // Check if the question is in this paper
    const existing = await query<any[]>(
      'SELECT id FROM exam_paper_questions WHERE exam_paper_id = ? AND question_id = ?',
      [paperId, questionId]
    );

    console.log('Existing check:', existing);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Question not found in this paper' },
        { status: 404 }
      );
    }

    // Remove question from paper
    await query(
      'DELETE FROM exam_paper_questions WHERE exam_paper_id = ? AND question_id = ?',
      [paperId, questionId]
    );

    // Update question usage count
    await query(
      'UPDATE questions SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = ?',
      [questionId]
    );

    console.log('Question removed successfully');

    return NextResponse.json({
      success: true,
      message: 'Question removed from paper successfully',
    });
  } catch (error) {
    console.error('DELETE /api/exam-papers/[id]/questions/[questionId] error:', error);
    return NextResponse.json(
      { error: 'Failed to remove question from paper', details: String(error) },
      { status: 500 }
    );
  }
}