/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/complete-print/route.ts
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

    // Check permissions - Only Exam Master who started printing or Admin
    if (session.role !== 'exam_master' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only Exam Masters can complete printing' },
        { status: 403 }
      );
    }

    // Check if paper is in printing status
    if (paper.status !== 'printing') {
      return NextResponse.json(
        { error: 'Paper must be in printing status' },
        { status: 400 }
      );
    }

    await transaction(async (connection) => {
      // Update paper status
      await connection.execute(
        `UPDATE exam_papers 
         SET status = 'printed',
             printed_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [paperId]
      );

      // Log workflow history
      await connection.execute(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, 'printed', 'printing', 'printed', ?, ?, ?)`,
        [
          paperId,
          session.id,
          session.role,
          `Printing completed - ${paper.print_quantity} copies printed`
        ]
      );

      // Notify paper creator and HOD
      const notifyUsers = [paper.created_by];
      if (paper.hod_id) notifyUsers.push(paper.hod_id);

      for (const userId of notifyUsers) {
        await connection.execute(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_paper_id, priority, action_url)
           VALUES (?, 'print_completed', ?, ?, ?, 'medium', ?)`,
          [
            userId,
            'Paper Printing Completed',
            `Printing completed for paper ${paper.paper_code} (${paper.print_quantity} copies)`,
            paperId,
            `/exam-papers/${paperId}`
          ]
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Printing completed successfully',
    });
  } catch (error) {
    console.error('POST /api/exam-papers/[paperId]/complete-print error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete printing', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}