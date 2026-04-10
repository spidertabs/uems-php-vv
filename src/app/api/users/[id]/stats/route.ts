/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.id);

    // Users can view their own stats, admins can view anyone's
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user details first
    const userDetails = await query<any[]>(
      `SELECT id, role, first_name, last_name, email, created_at 
       FROM users 
       WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!userDetails || userDetails.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = userDetails[0];
    const stats: Record<string, any> = {
      user_id: userId,
      role: targetUser.role,
      member_since: targetUser.created_at,
    };

    // Get papers created by user
    const papersCreated = await query<any[]>(
      'SELECT COUNT(*) as count FROM exam_papers WHERE created_by = ? AND deleted_at IS NULL',
      [userId]
    );
    stats.papers_created = papersCreated[0]?.count || 0;

    // Get questions created by user
    const questionsCreated = await query<any[]>(
      'SELECT COUNT(*) as count FROM questions WHERE created_by = ? AND deleted_at IS NULL',
      [userId]
    );
    stats.questions_created = questionsCreated[0]?.count || 0;

    // Role-specific stats
    if (targetUser.role === 'hod') {
      // Papers approved by HOD
      const papersApproved = await query<any[]>(
        'SELECT COUNT(*) as count FROM exam_papers WHERE hod_id = ? AND hod_approved_at IS NOT NULL AND deleted_at IS NULL',
        [userId]
      );
      stats.papers_approved = papersApproved[0]?.count || 0;

      // Papers rejected by HOD
      const papersRejected = await query<any[]>(
        "SELECT COUNT(*) as count FROM exam_papers WHERE hod_id = ? AND status = 'hod_rejected' AND deleted_at IS NULL",
        [userId]
      );
      stats.papers_rejected = papersRejected[0]?.count || 0;

      // Permissions granted
      const permissionsGranted = await query<any[]>(
        'SELECT COUNT(*) as count FROM lecturer_permissions WHERE granted_by = ? AND is_active = TRUE',
        [userId]
      );
      stats.permissions_granted = permissionsGranted[0]?.count || 0;

      // Courses managed
      const coursesManaged = await query<any[]>(
        'SELECT COUNT(*) as count FROM courses WHERE hod_id = ? AND deleted_at IS NULL',
        [userId]
      );
      stats.courses_managed = coursesManaged[0]?.count || 0;
    }

    if (targetUser.role === 'dean') {
      // Papers approved by Dean
      const papersApproved = await query<any[]>(
        'SELECT COUNT(*) as count FROM exam_papers WHERE dean_id = ? AND dean_approved_at IS NOT NULL AND deleted_at IS NULL',
        [userId]
      );
      stats.papers_approved = papersApproved[0]?.count || 0;

      // Papers rejected by Dean
      const papersRejected = await query<any[]>(
        "SELECT COUNT(*) as count FROM exam_papers WHERE dean_id = ? AND status = 'dean_rejected' AND deleted_at IS NULL",
        [userId]
      );
      stats.papers_rejected = papersRejected[0]?.count || 0;
    }

    if (targetUser.role === 'exam_master') {
      // Papers printed
      const papersPrinted = await query<any[]>(
        'SELECT COUNT(*) as count FROM exam_papers WHERE exam_master_id = ? AND status IN (\'printed\', \'published\') AND deleted_at IS NULL',
        [userId]
      );
      stats.papers_printed = papersPrinted[0]?.count || 0;

      // Total copies printed
      const totalCopies = await query<any[]>(
        'SELECT COALESCE(SUM(print_quantity), 0) as total FROM exam_papers WHERE exam_master_id = ? AND deleted_at IS NULL',
        [userId]
      );
      stats.total_copies_printed = totalCopies[0]?.total || 0;
    }

    // Get papers by status (for all roles)
    const papersByStatus = await query<any[]>(
      `SELECT 
        status,
        COUNT(*) as count
       FROM exam_papers 
       WHERE created_by = ? AND deleted_at IS NULL
       GROUP BY status`,
      [userId]
    );

    stats.papers_by_status = {};
    papersByStatus.forEach(row => {
      stats.papers_by_status[row.status] = row.count;
    });

    // Get recent activity count
    const recentActivity = await query<any[]>(
      `SELECT COUNT(*) as count 
       FROM workflow_history wh
       JOIN exam_papers ep ON wh.exam_paper_id = ep.id
       WHERE wh.actor_id = ? 
         AND wh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         AND ep.deleted_at IS NULL`,
      [userId]
    );
    stats.recent_activities = recentActivity[0]?.count || 0;

    // Get comments made
    const commentsMade = await query<any[]>(
      `SELECT COUNT(*) as count 
       FROM paper_comments 
       WHERE user_id = ?`,
      [userId]
    );
    stats.comments_made = commentsMade[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}