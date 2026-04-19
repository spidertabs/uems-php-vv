// ============================================================
// src/app/api/print-queue/[paperId]/start/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string }> } // CHANGED: params is now a Promise
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId, role } = session;
    if (!['exam_master', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // CRITICAL FIX: Await params before accessing paperId
    const { paperId: paperIdStr } = await params;
    const paperId = parseInt(paperIdStr);

    // Verify paper exists and is in ready_for_print status
    const paperCheck = await query<any[]>(
      `SELECT status, paper_code FROM exam_papers WHERE id = ? AND deleted_at IS NULL`,
      [paperId]
    );

    if (!paperCheck || paperCheck.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (paperCheck[0].status !== 'ready_for_print') {
      return NextResponse.json(
        { error: `Paper is not ready for printing. Current status: ${paperCheck[0].status}` },
        { status: 400 }
      );
    }

    // Update paper status to printing
    await query(
      `UPDATE exam_papers 
       SET status = 'printing',
           exam_master_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [userId, paperId]
    );

    // Add workflow history
    await query(
      `INSERT INTO workflow_history 
       (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
       VALUES (?, 'printing_started', 'ready_for_print', 'printing', ?, ?, 'Printing started')`,
      [paperId, userId, role]
    );

    // Create notification for paper creator
    const paperInfo = await query<any[]>(
      `SELECT created_by, paper_code FROM exam_papers WHERE id = ?`,
      [paperId]
    );

    if (paperInfo && paperInfo.length > 0) {
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority)
         VALUES (?, 'print_completed', 'Printing Started', ?, ?, 'medium')`,
        [
          paperInfo[0].created_by,
          `Printing has started for paper ${paperInfo[0].paper_code}`,
          paperId,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Printing started successfully',
      paper_code: paperCheck[0].paper_code,
    });
  } catch (error) {
    console.error('POST /api/print-queue/[paperId]/start error:', error);
    return NextResponse.json(
      { error: 'Failed to start printing', details: String(error) },
      { status: 500 }
    );
  }
}