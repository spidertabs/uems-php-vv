
// ============================================================
// FILE 3: src/app/api/print-queue/[paperId]/complete/route.ts
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['exam_master', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Only Exam Masters can complete printing' },
        { status: 403 }
      );
    }

    // CRITICAL FIX: Await the params object
    const { paperId } = await params;
    const paperIdNum = parseInt(paperId);

    const body = await request.json();
    const { print_quantity } = body;

    if (!print_quantity || print_quantity < 1) {
      return NextResponse.json(
        { error: 'Valid print quantity is required' },
        { status: 400 }
      );
    }

    // Verify paper exists and is in printing status
    const paperCheck = await query<any[]>(
      `SELECT ep.id, ep.status, ep.paper_code, ep.created_by, ep.hod_id, 
              c.title as course_title
       FROM exam_papers ep
       JOIN courses c ON ep.course_id = c.id
       WHERE ep.id = ? AND ep.deleted_at IS NULL`,
      [paperIdNum]
    );

    if (!paperCheck || paperCheck.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperCheck[0];

    if (paper.status !== 'printing') {
      return NextResponse.json(
        { error: `Paper is not being printed. Current status: ${paper.status}` },
        { status: 400 }
      );
    }

    // Update paper status to printed
    await query(
      `UPDATE exam_papers 
       SET status = 'printed',
           printed_at = NOW(),
           print_quantity = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [print_quantity, paperIdNum]
    );

    // Create workflow history
    const metadata = JSON.stringify({ print_quantity });
    await query(
      `INSERT INTO workflow_history 
       (exam_paper_id, action, from_status, to_status, actor_id, actor_role, metadata)
       VALUES (?, 'printed', 'printing', 'printed', ?, ?, ?)`,
      [paperIdNum, session.id, session.role, metadata]
    );

    // Notify paper creator
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_paper_id, action_url, priority)
       VALUES (?, 'print_completed', ?, ?, ?, ?, 'medium')`,
      [
        paper.created_by,
        `Paper ${paper.paper_code} Printed`,
        `Your exam paper has been successfully printed (${print_quantity} copies).`,
        paperIdNum,
        `/exam-papers/${paperIdNum}`,
      ]
    );

    // Also notify HOD if exists
    if (paper.hod_id) {
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, action_url, priority)
         VALUES (?, 'print_completed', ?, ?, ?, ?, 'low')`,
        [
          paper.hod_id,
          `Paper ${paper.paper_code} Printed`,
          `Exam paper for ${paper.course_title} has been printed (${print_quantity} copies).`,
          paperIdNum,
          `/exam-papers/${paperIdNum}`,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Printing completed successfully',
      paper_code: paper.paper_code,
      print_quantity,
    });
  } catch (error) {
    console.error('POST /api/print-queue/[paperId]/complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete printing', details: String(error) },
      { status: 500 }
    );
  }
}