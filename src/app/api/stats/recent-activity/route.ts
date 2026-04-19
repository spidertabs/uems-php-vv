/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/stats/recent-activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  link?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let activities: RecentActivity[] = [];

    // Fetch workflow history based on user role
    switch (user.role) {
      case 'lecturer':
        activities = await getLecturerActivities(user.id);
        break;
      case 'hod':
        activities = await getHODActivities(user.id);
        break;
      case 'dean':
        if (user.college_id) {
          activities = await getDeanActivities(user.college_id);
        }
        break;
      case 'exam_master':
        activities = await getExamMasterActivities();
        break;
      case 'admin':
        activities = await getAdminActivities();
        break;
      default:
        activities = [];
    }

    // Sort by timestamp descending and limit to 10
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: activities.slice(0, 10),
    });
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}

async function getLecturerActivities(userId: number): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Get workflow history for lecturer's papers
  const workflowHistory = await query<any[]>(
    `SELECT 
      wh.id,
      wh.action,
      wh.to_status,
      wh.comments,
      wh.created_at,
      ep.id as paper_id,
      ep.paper_code,
      c.code as course_code,
      c.title as course_title,
      CONCAT(u.first_name, ' ', u.last_name) as actor_name
    FROM workflow_history wh
    JOIN exam_papers ep ON wh.exam_paper_id = ep.id
    JOIN courses c ON ep.course_id = c.id
    JOIN users u ON wh.actor_id = u.id
    WHERE ep.created_by = ? AND ep.deleted_at IS NULL
    ORDER BY wh.created_at DESC
    LIMIT 8`,
    [userId]
  );

  for (const item of workflowHistory) {
    activities.push({
      id: item.id,
      type: item.action,
      title: getActivityTitle(item.action, item.paper_code),
      description: `${item.course_code} - ${item.course_title}${item.actor_name ? ` by ${item.actor_name}` : ''}`,
      timestamp: item.created_at,
      icon: getActivityIcon(item.action),
      link: `/exam-papers/${item.paper_id}`,
    });
  }

  // Get recent comments on lecturer's papers
  const comments = await query<any[]>(
    `SELECT 
      pc.id,
      pc.comment,
      pc.comment_type,
      pc.created_at,
      ep.id as paper_id,
      ep.paper_code,
      c.code as course_code,
      CONCAT(u.first_name, ' ', u.last_name) as commenter_name
    FROM paper_comments pc
    JOIN exam_papers ep ON pc.exam_paper_id = ep.id
    JOIN courses c ON ep.course_id = c.id
    JOIN users u ON pc.user_id = u.id
    WHERE ep.created_by = ? AND pc.user_id != ? AND ep.deleted_at IS NULL
    ORDER BY pc.created_at DESC
    LIMIT 5`,
    [userId, userId]
  );

  for (const comment of comments) {
    activities.push({
      id: comment.id + 100000, // Offset to avoid ID conflicts
      type: 'comment_added',
      title: `New comment on ${comment.paper_code}`,
      description: `${comment.commenter_name}: ${comment.comment.substring(0, 80)}${comment.comment.length > 80 ? '...' : ''}`,
      timestamp: comment.created_at,
      icon: '💬',
      link: `/exam-papers/${comment.paper_id}`,
    });
  }

  return activities;
}

async function getHODActivities(userId: number): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Papers submitted to HOD for approval
  const submissions = await query<any[]>(
    `SELECT 
      ep.id,
      ep.paper_code,
      ep.status,
      ep.submitted_at,
      ep.created_at,
      c.code as course_code,
      c.title as course_title,
      CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
    FROM exam_papers ep
    JOIN courses c ON ep.course_id = c.id
    JOIN users u ON ep.created_by = u.id
    WHERE c.hod_id = ? 
      AND ep.status IN ('submitted', 'hod_review')
      AND ep.deleted_at IS NULL
    ORDER BY ep.submitted_at DESC
    LIMIT 5`,
    [userId]
  );

  for (const paper of submissions) {
    activities.push({
      id: paper.id,
      type: 'paper_submitted',
      title: `Paper awaiting review: ${paper.paper_code}`,
      description: `${paper.course_code} - ${paper.course_title} submitted by ${paper.lecturer_name}`,
      timestamp: paper.submitted_at || paper.created_at,
      icon: '📝',
      link: `/exam-papers/${paper.id}`,
    });
  }

  // Recent workflow actions in HOD's courses
  const workflowHistory = await query<any[]>(
    `SELECT 
      wh.id,
      wh.action,
      wh.to_status,
      wh.comments,
      wh.created_at,
      ep.id as paper_id,
      ep.paper_code,
      c.code as course_code,
      c.title as course_title,
      CONCAT(u.first_name, ' ', u.last_name) as actor_name
    FROM workflow_history wh
    JOIN exam_papers ep ON wh.exam_paper_id = ep.id
    JOIN courses c ON ep.course_id = c.id
    JOIN users u ON wh.actor_id = u.id
    WHERE c.hod_id = ? AND ep.deleted_at IS NULL
    ORDER BY wh.created_at DESC
    LIMIT 8`,
    [userId]
  );

  for (const item of workflowHistory) {
    activities.push({
      id: item.id + 200000,
      type: item.action,
      title: getActivityTitle(item.action, item.paper_code),
      description: `${item.course_code} - ${item.course_title}${item.actor_name ? ` by ${item.actor_name}` : ''}`,
      timestamp: item.created_at,
      icon: getActivityIcon(item.action),
      link: `/exam-papers/${item.paper_id}`,
    });
  }

  // Recent permissions granted
  const permissions = await query<any[]>(
    `SELECT 
      lp.id,
      lp.granted_at,
      c.code as course_code,
      c.title as course_title,
      CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
    FROM lecturer_permissions lp
    JOIN courses c ON lp.course_id = c.id
    JOIN users u ON lp.lecturer_id = u.id
    WHERE lp.granted_by = ? AND lp.is_active = TRUE
    ORDER BY lp.granted_at DESC
    LIMIT 3`,
    [userId]
  );

  for (const perm of permissions) {
    activities.push({
      id: perm.id + 300000,
      type: 'permission_granted',
      title: `Permission granted to ${perm.lecturer_name}`,
      description: `Can now manage questions for ${perm.course_code} - ${perm.course_title}`,
      timestamp: perm.granted_at,
      icon: '🔐',
      link: '/permissions',
    });
  }

  return activities;
}

async function getDeanActivities(collegeId: number): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Papers in college requiring dean review
  const deanReview = await query<any[]>(
    `SELECT 
      ep.id,
      ep.paper_code,
      ep.status,
      ep.hod_approved_at,
      ep.created_at,
      c.code as course_code,
      c.title as course_title,
      d.name as department_name,
      CONCAT(hod.first_name, ' ', hod.last_name) as hod_name
    FROM exam_papers ep
    JOIN courses c ON ep.course_id = c.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users hod ON c.hod_id = hod.id
    WHERE c.college_id = ? 
      AND ep.status IN ('hod_approved', 'dean_review')
      AND ep.deleted_at IS NULL
    ORDER BY ep.hod_approved_at DESC
    LIMIT 5`,
    [collegeId]
  );

  for (const paper of deanReview) {
    activities.push({
      id: paper.id,
      type: 'hod_approved',
      title: `Paper awaiting dean review: ${paper.paper_code}`,
      description: `${paper.course_code} - ${paper.course_title} (${paper.department_name || 'N/A'}) approved by ${paper.hod_name || 'HOD'}`,
      timestamp: paper.hod_approved_at || paper.created_at,
      icon: '✅',
      link: `/exam-papers/${paper.id}`,
    });
  }

  // Recent workflow in college
  const workflowHistory = await query<any[]>(
    `SELECT 
      wh.id,
      wh.action,
      wh.created_at,
      ep.id as paper_id,
      ep.paper_code,
      c.code as course_code,
      c.title as course_title,
      d.name as department_name,
      CONCAT(u.first_name, ' ', u.last_name) as actor_name
    FROM workflow_history wh
    JOIN exam_papers ep ON wh.exam_paper_id = ep.id
    JOIN courses c ON ep.course_id = c.id
    LEFT JOIN departments d ON c.department_id = d.id
    JOIN users u ON wh.actor_id = u.id
    WHERE c.college_id = ? AND ep.deleted_at IS NULL
    ORDER BY wh.created_at DESC
    LIMIT 8`,
    [collegeId]
  );

  for (const item of workflowHistory) {
    activities.push({
      id: item.id + 400000,
      type: item.action,
      title: getActivityTitle(item.action, item.paper_code),
      description: `${item.course_code} - ${item.course_title} (${item.department_name || 'N/A'}) by ${item.actor_name}`,
      timestamp: item.created_at,
      icon: getActivityIcon(item.action),
      link: `/exam-papers/${item.paper_id}`,
    });
  }

  return activities;
}

async function getExamMasterActivities(): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Papers ready for printing
  const printReady = await query<any[]>(
    `SELECT 
      ep.id,
      ep.paper_code,
      ep.status,
      ep.hod_approved_at,
      ep.exam_date,
      ep.created_at,
      c.code as course_code,
      c.title as course_title
    FROM exam_papers ep
    JOIN courses c ON ep.course_id = c.id
    WHERE ep.status = 'ready_for_print'
      AND ep.deleted_at IS NULL
    ORDER BY ep.hod_approved_at DESC
    LIMIT 5`,
    []
  );

  for (const paper of printReady) {
    activities.push({
      id: paper.id,
      type: 'ready_for_print',
      title: `Paper ready for printing: ${paper.paper_code}`,
      description: `${paper.course_code} - ${paper.course_title}${paper.exam_date ? ` | Exam: ${new Date(paper.exam_date).toLocaleDateString()}` : ''}`,
      timestamp: paper.hod_approved_at || paper.created_at,
      icon: '🖨️',
      link: `/print-queue/${paper.id}`,
    });
  }

  // Recent printing activities
  const printHistory = await query<any[]>(
    `SELECT 
      wh.id,
      wh.action,
      wh.created_at,
      wh.metadata,
      ep.id as paper_id,
      ep.paper_code,
      c.code as course_code,
      c.title as course_title
    FROM workflow_history wh
    JOIN exam_papers ep ON wh.exam_paper_id = ep.id
    JOIN courses c ON ep.course_id = c.id
    WHERE wh.action IN ('printing_started', 'printed', 'published')
      AND ep.deleted_at IS NULL
    ORDER BY wh.created_at DESC
    LIMIT 8`,
    []
  );

  for (const item of printHistory) {
    activities.push({
      id: item.id + 500000,
      type: item.action,
      title: getActivityTitle(item.action, item.paper_code),
      description: `${item.course_code} - ${item.course_title}`,
      timestamp: item.created_at,
      icon: getActivityIcon(item.action),
      link: `/exam-papers/${item.paper_id}`,
    });
  }

  return activities;
}

async function getAdminActivities(): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Recent system-wide activities
  const recentActivities = await query<any[]>(
    `SELECT 
      wh.id,
      wh.action,
      wh.to_status,
      wh.created_at,
      ep.id as paper_id,
      ep.paper_code,
      c.code as course_code,
      c.title as course_title,
      CONCAT(u.first_name, ' ', u.last_name) as actor_name,
      u.role as actor_role
    FROM workflow_history wh
    JOIN exam_papers ep ON wh.exam_paper_id = ep.id
    JOIN courses c ON ep.course_id = c.id
    JOIN users u ON wh.actor_id = u.id
    WHERE ep.deleted_at IS NULL
    ORDER BY wh.created_at DESC
    LIMIT 10`,
    []
  );

  for (const item of recentActivities) {
    activities.push({
      id: item.id,
      type: item.action,
      title: getActivityTitle(item.action, item.paper_code),
      description: `${item.course_code} - ${item.course_title} by ${item.actor_name} (${item.actor_role.replace('_', ' ').toUpperCase()})`,
      timestamp: item.created_at,
      icon: getActivityIcon(item.action),
      link: `/exam-papers/${item.paper_id}`,
    });
  }

  // Recent user registrations
  const newUsers = await query<any[]>(
    `SELECT 
      id,
      CONCAT(first_name, ' ', last_name) as name,
      email,
      role,
      created_at
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 5`,
    []
  );

  for (const user of newUsers) {
    activities.push({
      id: user.id + 600000,
      type: 'user_registered',
      title: `New user registered: ${user.name}`,
      description: `${user.email} (${user.role.replace('_', ' ').toUpperCase()})`,
      timestamp: user.created_at,
      icon: '👤',
      link: `/users/${user.id}`,
    });
  }

  return activities;
}

function getActivityTitle(action: string, paperCode: string): string {
  const titles: Record<string, string> = {
    created: `Paper created: ${paperCode}`,
    submitted: `Paper submitted: ${paperCode}`,
    hod_approved: `Paper approved by HOD: ${paperCode}`,
    hod_rejected: `Paper rejected by HOD: ${paperCode}`,
    dean_approved: `Paper approved by Dean: ${paperCode}`,
    dean_rejected: `Paper rejected by Dean: ${paperCode}`,
    ready_for_print: `Paper ready for printing: ${paperCode}`,
    printing_started: `Printing started: ${paperCode}`,
    printed: `Paper printed: ${paperCode}`,
    published: `Paper published: ${paperCode}`,
    returned: `Paper returned for revision: ${paperCode}`,
    updated: `Paper updated: ${paperCode}`,
  };

  return titles[action] || `${action.replace(/_/g, ' ')}: ${paperCode}`;
}

function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    created: '📄',
    submitted: '📝',
    hod_approved: '✅',
    hod_rejected: '❌',
    dean_approved: '✅',
    dean_rejected: '❌',
    ready_for_print: '🖨️',
    printing_started: '🖨️',
    printed: '✅',
    published: '📊',
    returned: '🔄',
    updated: '✏️',
    comment_added: '💬',
    user_registered: '👤',
    permission_granted: '🔐',
    paper_submitted: '📝',
  };

  return icons[action] || '📋';
}