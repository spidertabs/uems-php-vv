/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats: Record<string, number> = {
      myPapers: 0,
      pendingApprovals: 0,
      myQuestions: 0,
      notifications: 0,
    };

    // Get stats based on user role
    switch (user.role) {
      case 'lecturer':
        // Lecturer's own papers
        const lecturerPapers = await query<any[]>(
          'SELECT COUNT(*) as count FROM exam_papers WHERE created_by = ? AND deleted_at IS NULL',
          [user.id]
        );
        stats.myPapers = lecturerPapers[0]?.count || 0;

        // Lecturer's questions
        const lecturerQuestions = await query<any[]>(
          'SELECT COUNT(*) as count FROM questions WHERE created_by = ? AND deleted_at IS NULL',
          [user.id]
        );
        stats.myQuestions = lecturerQuestions[0]?.count || 0;

        // Papers to review (returned for revision)
        const toReview = await query<any[]>(
          "SELECT COUNT(*) as count FROM exam_papers WHERE created_by = ? AND status = 'hod_rejected' AND deleted_at IS NULL",
          [user.id]
        );
        stats.papersToReview = toReview[0]?.count || 0;
        break;

      case 'hod':
        // Papers in HOD's department awaiting approval
        const hodPapers = await query<any[]>(
          `SELECT COUNT(*) as count 
           FROM exam_papers ep
           JOIN courses c ON ep.course_id = c.id
           WHERE c.hod_id = ? AND ep.status IN ('submitted', 'hod_review') AND ep.deleted_at IS NULL`,
          [user.id]
        );
        stats.pendingApprovals = hodPapers[0]?.count || 0;

        // All papers in HOD's department
        const allHodPapers = await query<any[]>(
          `SELECT COUNT(*) as count 
           FROM exam_papers ep
           JOIN courses c ON ep.course_id = c.id
           WHERE c.hod_id = ? AND ep.deleted_at IS NULL`,
          [user.id]
        );
        stats.myPapers = allHodPapers[0]?.count || 0;

        // Questions in HOD's department
        const hodQuestions = await query<any[]>(
          `SELECT COUNT(*) as count 
           FROM questions q
           JOIN courses c ON q.course_id = c.id
           WHERE c.hod_id = ? AND q.deleted_at IS NULL`,
          [user.id]
        );
        stats.myQuestions = hodQuestions[0]?.count || 0;

        // Department courses
        const deptCourses = await query<any[]>(
          'SELECT COUNT(*) as count FROM courses WHERE hod_id = ? AND is_active = TRUE AND deleted_at IS NULL',
          [user.id]
        );
        stats.departmentCourses = deptCourses[0]?.count || 0;
        break;

      case 'dean':
        // Papers in Dean's college
        const deanPapers = await query<any[]>(
          `SELECT COUNT(*) as count 
           FROM exam_papers ep
           JOIN courses c ON ep.course_id = c.id
           WHERE c.college_id = ? AND ep.deleted_at IS NULL`,
          [user.college_id]
        );
        stats.collegePapers = deanPapers[0]?.count || 0;

        // Pending approvals in Dean's college
        const deanApprovals = await query<any[]>(
          `SELECT COUNT(*) as count 
           FROM exam_papers ep
           JOIN courses c ON ep.course_id = c.id
           WHERE c.college_id = ? AND ep.status IN ('hod_approved', 'dean_review') AND ep.deleted_at IS NULL`,
          [user.college_id]
        );
        stats.pendingApprovals = deanApprovals[0]?.count || 0;

        // Active courses in college
        const activeCourses = await query<any[]>(
          'SELECT COUNT(*) as count FROM courses WHERE college_id = ? AND is_active = TRUE AND deleted_at IS NULL',
          [user.college_id]
        );
        stats.activeCourses = activeCourses[0]?.count || 0;
        break;

      case 'exam_master':
        // Papers ready for printing
        const printPapers = await query<any[]>(
          "SELECT COUNT(*) as count FROM exam_papers WHERE status IN ('ready_for_print', 'printing') AND deleted_at IS NULL",
          []
        );
        stats.printQueue = printPapers[0]?.count || 0;

        // Total papers handled
        const handledPapers = await query<any[]>(
          'SELECT COUNT(*) as count FROM exam_papers WHERE exam_master_id = ? AND deleted_at IS NULL',
          [user.id]
        );
        stats.myPapers = handledPapers[0]?.count || 0;

        // Published papers
        const published = await query<any[]>(
          "SELECT COUNT(*) as count FROM exam_papers WHERE status = 'published' AND deleted_at IS NULL",
          []
        );
        stats.collegePapers = published[0]?.count || 0;
        break;

      case 'admin':
        // All papers
        const allPapers = await query<any[]>(
          'SELECT COUNT(*) as count FROM exam_papers WHERE deleted_at IS NULL',
          []
        );
        stats.myPapers = allPapers[0]?.count || 0;

        // Papers needing approval
        const needsApproval = await query<any[]>(
          "SELECT COUNT(*) as count FROM exam_papers WHERE status IN ('submitted', 'hod_review', 'dean_review') AND deleted_at IS NULL",
          []
        );
        stats.pendingApprovals = needsApproval[0]?.count || 0;

        // All questions
        const allQuestions = await query<any[]>(
          'SELECT COUNT(*) as count FROM questions WHERE deleted_at IS NULL',
          []
        );
        stats.myQuestions = allQuestions[0]?.count || 0;

        // Total users
        const totalUsers = await query<any[]>(
          'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL',
          []
        );
        stats.totalUsers = totalUsers[0]?.count || 0;
        break;
    }

    // Get unread notifications for all users
    const notifications = await query<any[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user.id]
    );
    stats.notifications = notifications[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}