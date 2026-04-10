/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/approvals/[paperId]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
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
    const paperId = parseInt(resolvedParams.paperId);

    // Only HOD, Dean, and Admin can approve
    if (!['hod', 'dean', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Access denied. Only HODs, Deans, and Admins can approve papers.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { comments } = body;

    // Get paper details
    const papers = await query<any[]>(
      `SELECT ep.*, 
              c.department_id, 
              c.college_id,
              CONCAT(creator.first_name, ' ', creator.last_name) AS creator_name,
              CONCAT(hod.first_name, ' ', hod.last_name) AS hod_name,
              CONCAT(dean.first_name, ' ', dean.last_name) AS dean_name
       FROM exam_papers ep
       JOIN courses c ON ep.course_id = c.id
       LEFT JOIN users creator ON ep.created_by = creator.id
       LEFT JOIN users hod ON ep.hod_id = hod.id
       LEFT JOIN users dean ON ep.dean_id = dean.id
       WHERE ep.id = ? AND ep.deleted_at IS NULL`,
      [paperId]
    );

    if (!papers || papers.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = papers[0];
    let newStatus = '';
    let action = '';
    let notificationMessage = '';

    // Handle HOD approval
    if (session.role === 'hod') {
      // Verify HOD has permission (only check if not admin)
      if (paper.hod_id !== session.id) {
        return NextResponse.json(
          { error: 'You do not have permission to approve this paper' },
          { status: 403 }
        );
      }

      if (!['submitted', 'hod_review'].includes(paper.status)) {
        return NextResponse.json(
          { error: `Cannot approve paper with status: ${paper.status}` },
          { status: 400 }
        );
      }

      newStatus = 'hod_approved';
      action = 'hod_approved';
      notificationMessage = `Your exam paper ${paper.paper_code} has been approved by HOD ${session.first_name} ${session.last_name}. It will now proceed to Dean review.`;

      // Update paper
      await query(
        `UPDATE exam_papers 
         SET status = ?,
             hod_approved_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, paperId]
      );

      // Notify lecturer
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority, action_url)
         VALUES (?, 'paper_approved', 'Paper Approved by HOD', ?, ?, 'high', ?)`,
        [paper.created_by, notificationMessage, paperId, `/exam-papers/${paperId}`]
      );

      // Notify Dean
      if (paper.dean_id) {
        await query(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_paper_id, priority, action_url)
           VALUES (?, 'approval_required', 'New Paper Awaiting Dean Approval', ?, ?, 'high', ?)`,
          [
            paper.dean_id,
            `Exam paper ${paper.paper_code} has been approved by HOD and is awaiting your review.`,
            paperId,
            `/exam-papers/${paperId}`
          ]
        );
      }
    }
    // Handle Dean approval
    else if (session.role === 'dean') {
      // Verify Dean has permission (only check if not admin)
      if (paper.dean_id !== session.id) {
        return NextResponse.json(
          { error: 'You do not have permission to approve this paper' },
          { status: 403 }
        );
      }

      if (!['hod_approved', 'dean_review'].includes(paper.status)) {
        return NextResponse.json(
          { error: `Cannot approve paper with status: ${paper.status}` },
          { status: 400 }
        );
      }

      newStatus = 'dean_approved';
      action = 'dean_approved';
      notificationMessage = `Your exam paper ${paper.paper_code} has been approved by Dean ${session.first_name} ${session.last_name}. It is now ready for printing.`;

      // Update paper to ready for print
      await query(
        `UPDATE exam_papers 
         SET status = 'ready_for_print',
             dean_approved_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [paperId]
      );

      // Notify lecturer
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority, action_url)
         VALUES (?, 'paper_approved', 'Paper Approved by Dean', ?, ?, 'high', ?)`,
        [paper.created_by, notificationMessage, paperId, `/exam-papers/${paperId}`]
      );

      // Notify HOD
      if (paper.hod_id) {
        await query(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_paper_id, priority, action_url)
           VALUES (?, 'paper_approved', 'Paper Approved by Dean', ?, ?, 'medium', ?)`,
          [
            paper.hod_id,
            `Exam paper ${paper.paper_code} has been approved by the Dean and is ready for printing.`,
            paperId,
            `/exam-papers/${paperId}`
          ]
        );
      }

      // Notify Exam Masters
      const examMasters = await query<any[]>(
        `SELECT id FROM users WHERE role = 'exam_master' AND is_active = TRUE AND deleted_at IS NULL`
      );

      for (const master of examMasters) {
        await query(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_paper_id, priority, action_url)
           VALUES (?, 'approval_required', 'New Paper Ready for Print', ?, ?, 'high', ?)`,
          [
            master.id,
            `Exam paper ${paper.paper_code} has been fully approved and is ready for printing.`,
            paperId,
            `/print-queue`
          ]
        );
      }

      newStatus = 'ready_for_print';
      action = 'dean_approved';
    }
    // Handle Admin approval
    else if (session.role === 'admin') {
      if (['submitted', 'hod_review'].includes(paper.status)) {
        newStatus = 'hod_approved';
        action = 'hod_approved';
      } else if (['hod_approved', 'dean_review'].includes(paper.status)) {
        newStatus = 'ready_for_print';
        action = 'dean_approved';
      } else {
        return NextResponse.json(
          { error: `Cannot approve paper with status: ${paper.status}` },
          { status: 400 }
        );
      }

      await query(
        `UPDATE exam_papers 
         SET status = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, paperId]
      );

      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority, action_url)
         VALUES (?, 'paper_approved', 'Paper Approved', ?, ?, 'high', ?)`,
        [
          paper.created_by,
          `Your exam paper ${paper.paper_code} has been approved by an administrator.`,
          paperId,
          `/exam-papers/${paperId}`
        ]
      );
    }

    // Log workflow history
    await query(
      `INSERT INTO workflow_history 
       (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paperId, action, paper.status, newStatus, session.id, session.role, comments || 'Approved']
    );

    // Add approval comment if provided
    if (comments) {
      await query(
        `INSERT INTO paper_comments 
         (exam_paper_id, user_id, comment_type, comment)
         VALUES (?, ?, 'hod_approval_note', ?)`,
        [paperId, session.id, comments]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Paper approved successfully',
      nextStatus: newStatus,
    });
  } catch (error) {
    console.error('POST /api/approvals/[paperId]/approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve paper', details: String(error) },
      { status: 500 }
    );
  }
}