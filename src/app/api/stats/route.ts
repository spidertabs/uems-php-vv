/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/stats/route.ts
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
      myCandidates: 0,
      upcomingVivas: 0,
      papersToReview: 0,
    };

    // Get stats based on user role
    switch (user.role) {
      case 'lecturer':
      case 'professor':
      case 'external_examiner':
        await getLecturerStats(user.id, stats);
        break;
      case 'hod':
        await getHODStats(user, stats);
        break;
      case 'dean':
        if (user.college_id) {
          await getDeanStats(user.college_id, stats);
        }
        break;
      case 'exam_master':
        await getExamMasterStats(user.id, stats);
        break;
      case 'admin':
      case 'viva_coordinator':
        await getAdminStats(stats);
        if (user.role === 'viva_coordinator') {
          // Additional PhD specific summary for coordinator
          const phdTotal = await query<any[]>('SELECT COUNT(*) as count FROM phd_candidates WHERE deleted_at IS NULL');
          stats.totalCandidates = phdTotal[0]?.count || 0;
        }
        break;
    }

    // Get unread notifications for all staff
    const notifications = await query<any[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND archived_at IS NULL',
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

async function getLecturerStats(userId: number, stats: Record<string, number>) {
  // Lecturer's papers (created by them OR where they have explict permissions for the course)
  const lecturerPapers = await query<any[]>(
    `SELECT COUNT(DISTINCT ep.id) as count 
     FROM exam_papers ep
     WHERE (ep.created_by = ? OR EXISTS (
       SELECT 1 FROM lecturer_permissions lp 
       WHERE lp.lecturer_id = ? 
       AND lp.course_id = ep.course_id 
       AND lp.is_active = TRUE
     )) AND ep.deleted_at IS NULL`,
    [userId, userId]
  );
  stats.myPapers = Number(lecturerPapers[0]?.count || 0);

  // Lecturer's questions
  const lecturerQuestions = await query<any[]>(
    'SELECT COUNT(*) as count FROM questions WHERE created_by = ? AND deleted_at IS NULL',
    [userId]
  );
  stats.myQuestions = Number(lecturerQuestions[0]?.count || 0);

  // Papers to review (returned for revision)
  const toReview = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE created_by = ? 
       AND status = 'hod_rejected' 
       AND deleted_at IS NULL`,
    [userId]
  );
  stats.papersToReview = Number(toReview[0]?.count || 0);

  // Draft papers
  const drafts = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE created_by = ? 
       AND status = 'draft' 
       AND deleted_at IS NULL`,
    [userId]
  );
  stats.draftPapers = Number(drafts[0]?.count || 0);

  // Submitted papers (pending HOD review)
  const submitted = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE created_by = ? 
       AND status IN ('submitted', 'hod_review') 
       AND deleted_at IS NULL`,
    [userId]
  );
  stats.submittedPapers = Number(submitted[0]?.count || 0);

  // Approved papers
  const approved = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE created_by = ? 
       AND status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed', 'published') 
       AND deleted_at IS NULL`,
    [userId]
  );
  stats.approvedPapers = Number(approved[0]?.count || 0);

  // PhD Candidates assigned to this lecturer (includes supervisors and internal/external examiners)
  const phdCount = await query<any[]>(
    `SELECT COUNT(DISTINCT pc.id) as count 
     FROM phd_candidates pc
     LEFT JOIN viva_schedules vs ON pc.id = vs.candidate_id
     LEFT JOIN viva_examiners ve ON vs.id = ve.viva_id
     WHERE (pc.supervisor_id = ? OR pc.co_supervisor_id = ? OR ve.examiner_id = ? OR pc.id IN (
       SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?
     ))
       AND pc.deleted_at IS NULL`,
    [userId, userId, userId, userId]
  );
  stats.myCandidates = Number(phdCount[0]?.count || 0);

  // Upcoming Vivas for this lecturer/professor
  const upcomingVivasCount = await query<any[]>(
    `SELECT COUNT(DISTINCT vs.id) as count 
     FROM viva_schedules vs
     JOIN phd_candidates pc ON vs.candidate_id = pc.id
     LEFT JOIN viva_examiners ve ON vs.id = ve.viva_id
     WHERE vs.status IN ('scheduled', 'in_progress')
       AND (pc.supervisor_id = ? OR pc.co_supervisor_id = ? OR ve.examiner_id = ? OR pc.id IN (
         SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?
       ))`,
    [userId, userId, userId, userId]
  );
  stats.upcomingVivas = Number(upcomingVivasCount[0]?.count || 0);
}

async function getHODStats(user: any, stats: Record<string, number>) {
  const userId = user.id;
  const deptId = user.department_id;

  // Papers in HOD's department awaiting approval
  const hodPapers = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE (c.department_id = ? OR c.hod_id = ?) 
       AND ep.status IN ('submitted', 'hod_review') 
       AND ep.deleted_at IS NULL`,
    [deptId, userId]
  );
  stats.pendingApprovals = Number(hodPapers[0]?.count || 0);

  // All papers in HOD's department + papers they created personally
  const allHodPapers = await query<any[]>(
    `SELECT COUNT(DISTINCT ep.id) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE (c.department_id = ? OR c.hod_id = ? OR ep.created_by = ?) 
       AND ep.deleted_at IS NULL`,
    [deptId, userId, userId]
  );
  stats.myPapers = Number(allHodPapers[0]?.count || 0);

  // Questions in HOD's department + questions they created
  const hodQuestions = await query<any[]>(
    `SELECT COUNT(DISTINCT q.id) as count 
     FROM questions q
     JOIN courses c ON q.course_id = c.id
     WHERE (c.department_id = ? OR c.hod_id = ? OR q.created_by = ?) 
       AND q.deleted_at IS NULL`,
    [deptId, userId, userId]
  );
  stats.myQuestions = Number(hodQuestions[0]?.count || 0);

  // Department courses
  const deptCourses = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM courses 
     WHERE (department_id = ? OR hod_id = ?) 
       AND is_active = TRUE 
       AND deleted_at IS NULL`,
    [deptId, userId]
  );
  stats.departmentCourses = Number(deptCourses[0]?.count || 0);

  // Approved papers (by this department/HOD)
  const approved = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE (c.department_id = ? OR ep.hod_id = ?) 
       AND ep.status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed', 'published') 
       AND ep.deleted_at IS NULL`,
    [deptId, userId]
  );
  stats.approvedPapers = Number(approved[0]?.count || 0);

  // Rejected papers (by this department/HOD)
  const rejected = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE (c.department_id = ? OR ep.hod_id = ?) 
       AND ep.status = 'hod_rejected' 
       AND ep.deleted_at IS NULL`,
    [deptId, userId]
  );
  stats.rejectedPapers = Number(rejected[0]?.count || 0);

  // Lecturers with permissions in HOD's department
  const lecturersWithPermissions = await query<any[]>(
    `SELECT COUNT(DISTINCT lp.lecturer_id) as count 
     FROM lecturer_permissions lp
     JOIN courses c ON lp.course_id = c.id
     WHERE (c.department_id = ? OR c.hod_id = ?) 
       AND lp.is_active = TRUE`,
    [deptId, userId]
  );
  stats.lecturersWithPermissions = Number(lecturersWithPermissions[0]?.count || 0);

  // PhD Candidates in HOD's department (or where they are supervisor/examiner)
  const phdCount = await query<any[]>(
    `SELECT COUNT(DISTINCT pc.id) as count 
     FROM phd_candidates pc
     LEFT JOIN programmes p ON pc.programme_id = p.id
     LEFT JOIN viva_schedules vs ON pc.id = vs.candidate_id
     LEFT JOIN viva_examiners ve ON vs.id = ve.viva_id
     WHERE (pc.supervisor_id = ? OR pc.co_supervisor_id = ? OR ve.examiner_id = ? 
            OR p.department_id = ? OR pc.id IN (
              SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?
            ))
       AND pc.deleted_at IS NULL`,
    [userId, userId, userId, deptId, userId]
  );
  stats.myCandidates = Number(phdCount[0]?.count || 0);
}

async function getDeanStats(collegeId: number, stats: Record<string, number>) {
  // Papers in Dean's college
  const deanPapers = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE c.college_id = ? 
       AND ep.deleted_at IS NULL`,
    [collegeId]
  );
  stats.collegePapers = deanPapers[0]?.count || 0;
  stats.myPapers = deanPapers[0]?.count || 0;

  // Pending approvals in Dean's college (HOD approved, awaiting Dean)
  const deanApprovals = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE c.college_id = ? 
       AND ep.status IN ('hod_approved', 'dean_review') 
       AND ep.deleted_at IS NULL`,
    [collegeId]
  );
  stats.pendingApprovals = deanApprovals[0]?.count || 0;

  // Active courses in college
  const activeCourses = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM courses 
     WHERE college_id = ? 
       AND is_active = TRUE 
       AND deleted_at IS NULL`,
    [collegeId]
  );
  stats.activeCourses = activeCourses[0]?.count || 0;

  // Departments in college
  const departments = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM departments 
     WHERE college_id = ? 
       AND deleted_at IS NULL`,
    [collegeId]
  );
  stats.departments = departments[0]?.count || 0;

  // Dean approved papers
  const approved = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE c.college_id = ? 
       AND ep.status IN ('dean_approved', 'ready_for_print', 'printed', 'published') 
       AND ep.deleted_at IS NULL`,
    [collegeId]
  );
  stats.approvedPapers = approved[0]?.count || 0;

  // Published papers in college
  const published = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers ep
     JOIN courses c ON ep.course_id = c.id
     WHERE c.college_id = ? 
       AND ep.status = 'published' 
       AND ep.deleted_at IS NULL`,
    [collegeId]
  );
  stats.publishedPapers = published[0]?.count || 0;
}

async function getExamMasterStats(userId: number, stats: Record<string, number>) {
  // Papers ready for printing
  const printPapers = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status IN ('ready_for_print', 'printing') 
       AND deleted_at IS NULL`,
    []
  );
  stats.printQueue = printPapers[0]?.count || 0;

  // Total papers handled by this exam master
  const handledPapers = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE exam_master_id = ? 
       AND deleted_at IS NULL`,
    [userId]
  );
  stats.myPapers = handledPapers[0]?.count || 0;

  // Published papers
  const published = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status = 'published' 
       AND deleted_at IS NULL`,
    []
  );
  stats.collegePapers = published[0]?.count || 0;
  stats.publishedPapers = published[0]?.count || 0;

  // Currently printing
  const printing = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status = 'printing' 
       AND deleted_at IS NULL`,
    []
  );
  stats.currentlyPrinting = printing[0]?.count || 0;

  // Printed papers (completed)
  const printed = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status = 'printed' 
       AND deleted_at IS NULL`,
    []
  );
  stats.printedPapers = printed[0]?.count || 0;

  // Total print quantity handled
  const totalPrintQuantity = await query<any[]>(
    `SELECT COALESCE(SUM(print_quantity), 0) as total 
     FROM exam_papers 
     WHERE exam_master_id = ? 
       AND status IN ('printed', 'published') 
       AND deleted_at IS NULL`,
    [userId]
  );
  stats.totalPrintQuantity = totalPrintQuantity[0]?.total || 0;
}

async function getAdminStats(stats: Record<string, number>) {
  // All papers
  const allPapers = await query<any[]>(
    'SELECT COUNT(*) as count FROM exam_papers WHERE deleted_at IS NULL',
    []
  );
  stats.myPapers = allPapers[0]?.count || 0;
  stats.totalPapers = allPapers[0]?.count || 0;

  // Approved papers
  const approved = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed', 'published') 
       AND deleted_at IS NULL`,
    []
  );
  stats.approvedPapers = approved[0]?.count || 0;

  // Papers needing approval
  const needsApproval = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status IN ('submitted', 'hod_review', 'dean_review') 
       AND deleted_at IS NULL`,
    []
  );
  stats.pendingApprovals = needsApproval[0]?.count || 0;

  // All questions
  const allQuestions = await query<any[]>(
    'SELECT COUNT(*) as count FROM questions WHERE deleted_at IS NULL',
    []
  );
  stats.myQuestions = allQuestions[0]?.count || 0;
  stats.totalQuestions = allQuestions[0]?.count || 0;

  // Total staff
  const totalStaff = await query<any[]>(
    'SELECT COUNT(*) as count FROM staff WHERE deleted_at IS NULL',
    []
  );
  stats.totalStaff = totalStaff[0]?.count || 0;

  // Active staff (logged in within last 30 days)
  const activeStaff = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM staff 
     WHERE last_login >= NOW() - INTERVAL '30 days' 
       AND deleted_at IS NULL`,
    []
  );
  stats.activeStaff = activeStaff[0]?.count || 0;

  // Total colleges
  const colleges = await query<any[]>(
    'SELECT COUNT(*) as count FROM colleges WHERE deleted_at IS NULL',
    []
  );
  stats.totalColleges = colleges[0]?.count || 0;

  // Total departments
  const departments = await query<any[]>(
    'SELECT COUNT(*) as count FROM departments WHERE deleted_at IS NULL',
    []
  );
  stats.totalDepartments = departments[0]?.count || 0;

  // Total courses
  const courses = await query<any[]>(
    'SELECT COUNT(*) as count FROM courses WHERE deleted_at IS NULL',
    []
  );
  stats.totalCourses = courses[0]?.count || 0;

  // Active courses
  const activeCourses = await query<any[]>(
    'SELECT COUNT(*) as count FROM courses WHERE is_active = TRUE AND deleted_at IS NULL',
    []
  );
  stats.activeCourses = activeCourses[0]?.count || 0;

  // Papers by status
  const papersByStatus = await query<any[]>(
    `SELECT 
       status,
       COUNT(*) as count
     FROM exam_papers 
     WHERE deleted_at IS NULL
     GROUP BY status`,
    []
  );

  papersByStatus.forEach(row => {
    const statusKey = `${row.status}Papers`;
    stats[statusKey] = row.count || 0;
  });

  // Draft papers
  const drafts = await query<any[]>(
    `SELECT COUNT(*) as count FROM exam_papers WHERE status = 'draft' AND deleted_at IS NULL`,
    []
  );
  stats.draftPapers = drafts[0]?.count || 0;

  // Published papers
  const published = await query<any[]>(
    `SELECT COUNT(*) as count FROM exam_papers WHERE status = 'published' AND deleted_at IS NULL`,
    []
  );
  stats.publishedPapers = published[0]?.count || 0;

  // Print queue
  const printQueue = await query<any[]>(
    `SELECT COUNT(*) as count 
     FROM exam_papers 
     WHERE status IN ('ready_for_print', 'printing') 
       AND deleted_at IS NULL`,
    []
  );
  stats.printQueue = printQueue[0]?.count || 0;

  // Total programmes
  const programmes = await query<any[]>(
    'SELECT COUNT(*) as count FROM programmes WHERE deleted_at IS NULL',
    []
  );
  stats.totalProgrammes = programmes[0]?.count || 0;

  // Active permissions
  const permissions = await query<any[]>(
    'SELECT COUNT(*) as count FROM lecturer_permissions WHERE is_active = TRUE',
    []
  );
  stats.activePermissions = permissions[0]?.count || 0;
}