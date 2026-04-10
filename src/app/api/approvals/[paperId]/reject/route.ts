/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/approvals/[paperId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HOD, Dean, and Admin can reject
    if (!['hod', 'dean', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Only HODs and Deans can reject papers.' },
        { status: 403 }
      );
    }

    const paperId = parseInt(params.paperId);
    const body = await request.json();
    const { comments } = body;

    // Validate comments
    if (!comments || comments.trim() === '') {
      return NextResponse.json(
        { error: 'Rejection comments are required' },
        { status: 400 }
      );
    }

    // Get the paper details
    const papers = await query<any[]>(
      `SELECT ep.*, c.hod_id, c.college_id, c.department_id
       FROM exam_papers ep
       JOIN courses c ON ep.course_id = c.id
       WHERE ep.id = ? AND ep.deleted_at IS NULL`,
      [paperId]
    );

    if (papers.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = papers[0];

    // Verify user has permission to reject this paper
    if (user.role === 'hod') {
      if (paper.hod_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to reject this paper' },
          { status: 403 }
        );
      }

      if (!['submitted', 'hod_review'].includes(paper.status)) {
        return NextResponse.json(
          { error: `Cannot reject paper with status: ${paper.status}` },
          { status: 400 }
        );
      }

      // HOD rejection - return to lecturer
      await query(
        `UPDATE exam_papers 
         SET status = 'hod_rejected',
             hod_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [user.id, paperId]
      );

      // Log workflow
      await query(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, 'hod_rejected', ?, 'hod_rejected', ?, ?, ?)`,
        [paperId, paper.status, user.id, user.role, comments]
      );

      // Add rejection comment
      await query(
        `INSERT INTO paper_comments 
         (exam_paper_id, user_id, comment_type, comment)
         VALUES (?, ?, 'revision_request', ?)`,
        [paperId, user.id, comments]
      );

      // Notify lecturer
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority)
         VALUES (?, 'paper_rejected', 'Paper Rejected by HOD', ?, ?, 'urgent')`,
        [
          paper.created_by,
          `Your exam paper ${paper.paper_code} has been rejected by the HOD. Please review the feedback and make necessary revisions.`,
          paperId,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Paper rejected and returned to lecturer',
        nextStatus: 'hod_rejected',
      });
    } else if (user.role === 'dean') {
      if (paper.college_id !== user.college_id) {
        return NextResponse.json(
          { error: 'You do not have permission to reject this paper' },
          { status: 403 }
        );
      }

      if (!['hod_approved', 'dean_review'].includes(paper.status)) {
        return NextResponse.json(
          { error: `Cannot reject paper with status: ${paper.status}` },
          { status: 400 }
        );
      }

      // Dean rejection - return to HOD for revision
      await query(
        `UPDATE exam_papers 
         SET status = 'dean_rejected',
             dean_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [user.id, paperId]
      );

      // Log workflow
      await query(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, 'dean_rejected', ?, 'dean_rejected', ?, ?, ?)`,
        [paperId, paper.status, user.id, user.role, comments]
      );

      // Add rejection comment
      await query(
        `INSERT INTO paper_comments 
         (exam_paper_id, user_id, comment_type, comment)
         VALUES (?, ?, 'revision_request', ?)`,
        [paperId, user.id, comments]
      );

      // Notify lecturer
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority)
         VALUES (?, 'paper_rejected', 'Paper Rejected by Dean', ?, ?, 'urgent')`,
        [
          paper.created_by,
          `Your exam paper ${paper.paper_code} has been rejected by the Dean. Please review the feedback and make necessary revisions.`,
          paperId,
        ]
      );

      // Notify HOD
      if (paper.hod_id) {
        await query(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_paper_id, priority)
           VALUES (?, 'paper_rejected', 'Paper Rejected by Dean', ?, ?, 'high')`,
          [
            paper.hod_id,
            `Exam paper ${paper.paper_code} has been rejected by the Dean. Please work with the lecturer to address the issues.`,
            paperId,
          ]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Paper rejected by Dean',
        nextStatus: 'dean_rejected',
      });
    } else if (user.role === 'admin') {
      // Admin can reject at any stage
      let newStatus = 'hod_rejected';
      let action = 'rejected';

      if (['hod_approved', 'dean_review'].includes(paper.status)) {
        newStatus = 'dean_rejected';
        action = 'dean_rejected';
      }

      await query(
        `UPDATE exam_papers 
         SET status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newStatus, paperId]
      );

      await query(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paperId, action, paper.status, newStatus, user.id, user.role, comments]
      );

      await query(
        `INSERT INTO paper_comments 
         (exam_paper_id, user_id, comment_type, comment)
         VALUES (?, ?, 'revision_request', ?)`,
        [paperId, user.id, comments]
      );

      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority)
         VALUES (?, 'paper_rejected', 'Paper Rejected', ?, ?, 'urgent')`,
        [
          paper.created_by,
          `Your exam paper ${paper.paper_code} has been rejected. Please review the feedback and make necessary revisions.`,
          paperId,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Paper rejected successfully',
        nextStatus: newStatus,
      });
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to reject paper:', error);
    return NextResponse.json(
      { error: 'Failed to reject paper' },
      { status: 500 }
    );
  }
}