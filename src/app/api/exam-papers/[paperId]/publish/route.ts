/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

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

    // Check if paper exists
    const paperResult = await query<any[]>(
      'SELECT * FROM exam_papers WHERE id = ?',
      [paperId]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Check permissions - Only Exam Master or Admin
    if (session.role !== 'exam_master' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only Exam Masters or Admins can publish papers' },
        { status: 403 }
      );
    }

    // Check if paper is printed or ready for print
    if (!['printed', 'ready_for_print'].includes(paper.status)) {
      return NextResponse.json(
        { error: 'Paper must be printed before publishing' },
        { status: 400 }
      );
    }

    await transaction(async (connection) => {
      // Update paper status
      await connection.execute(
        `UPDATE exam_papers 
         SET status = 'published',
             published_at = NOW(),
             is_locked = TRUE,
             updated_at = NOW()
         WHERE id = ?`,
        [paperId]
      );

      // Log workflow history
      await connection.execute(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, 'published', ?, 'published', ?, ?, ?)`,
        [paperId, paper.status, session.id, session.role, 'Paper published']
      );

      // Notify relevant users (creator, HOD, Dean)
      const notifyUsers = [paper.created_by];
      if (paper.hod_id) notifyUsers.push(paper.hod_id);
      if (paper.dean_id) notifyUsers.push(paper.dean_id);

      for (const userId of notifyUsers) {
        await connection.execute(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_paper_id, priority, action_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            'general', // Changed from 'paper_published' to 'general'
            'Paper Published',
            `Paper ${paper.paper_code} has been published`,
            paperId,
            'high',
            `/exam-papers/${paperId}`
          ]
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Paper published successfully',
    });
  } catch (error) {
    console.error('POST /api/exam-papers/[paperId]/publish error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish paper', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}