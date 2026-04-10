/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/ready-for-print/route.ts
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

    // Check if paper exists and get current status
    const paperResult = await query<any[]>(
      `SELECT ep.*, c.department_id, c.college_id 
       FROM exam_papers ep
       JOIN courses c ON ep.course_id = c.id
       WHERE ep.id = ?`,
      [paperId]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Check permissions - Only HOD, Dean, or Admin can mark as ready for print
    const { role, department_id, college_id } = session;
    let hasPermission = false;

    if (role === 'admin') {
      hasPermission = true;
    } else if (role === 'hod' && paper.department_id === department_id) {
      hasPermission = true;
    } else if (role === 'dean' && paper.college_id === college_id) {
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Not authorized to mark this paper as ready for print' },
        { status: 403 }
      );
    }

    // Check if paper is in correct status
    if (paper.status !== 'hod_approved' && paper.status !== 'dean_approved') {
      return NextResponse.json(
        { error: 'Paper must be approved before marking as ready for print' },
        { status: 400 }
      );
    }

    await transaction(async (connection) => {
      // Update paper status
      await connection.execute(
        `UPDATE exam_papers 
         SET status = 'ready_for_print', 
             updated_at = NOW()
         WHERE id = ?`,
        [paperId]
      );

      // Log workflow history
      await connection.execute(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, 'ready_for_print', ?, 'ready_for_print', ?, ?, ?)`,
        [paperId, paper.status, session.id, session.role, 'Paper marked as ready for printing']
      );

      // Create notification for exam master
      const examMasters = await connection.execute(
        `SELECT id FROM users WHERE role = 'exam_master' AND is_active = TRUE`
      );

      if (examMasters[0] && Array.isArray(examMasters[0])) {
        for (const master of examMasters[0]) {
          await connection.execute(
            `INSERT INTO notifications 
             (user_id, type, title, message, related_paper_id, priority, action_url)
             VALUES (?, 'ready_for_print', ?, ?, ?, 'high', ?)`,
            [
              (master as any).id,
              'Paper Ready for Printing',
              `Paper ${paper.paper_code} is ready for printing`,
              paperId,
              `/print-queue/${paperId}`
            ]
          );
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Paper marked as ready for printing',
    });
  } catch (error) {
    console.error('POST /api/exam-papers/[paperId]/ready-for-print error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mark paper as ready for print', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}