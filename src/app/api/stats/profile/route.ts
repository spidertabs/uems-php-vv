/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/stats/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: user_id, role } = session;

    // Get user's statistics based on their role
    const stats: any = {
      totalPapers: 0,
      draftPapers: 0,
      submittedPapers: 0,
      approvedPapers: 0,
      rejectedPapers: 0,
      totalQuestions: 0,
      activeCourses: 0,
    };

    if (role === 'lecturer') {
      // Lecturer stats
      const paperStats = await query<any[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status IN ('submitted', 'hod_review', 'dean_review') THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status IN ('hod_approved', 'dean_approved', 'ready_for_print', 'printed', 'published') THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status IN ('hod_rejected', 'dean_rejected') THEN 1 ELSE 0 END) as rejected
        FROM exam_papers
        WHERE created_by = ? AND deleted_at IS NULL`,
        [user_id]
      );

      const questionStats = await query<any[]>(
        `SELECT COUNT(*) as total
        FROM questions
        WHERE created_by = ? AND deleted_at IS NULL AND is_active = TRUE`,
        [user_id]
      );

      stats.totalPapers = paperStats[0]?.total || 0;
      stats.draftPapers = paperStats[0]?.draft || 0;
      stats.submittedPapers = paperStats[0]?.submitted || 0;
      stats.approvedPapers = paperStats[0]?.approved || 0;
      stats.rejectedPapers = paperStats[0]?.rejected || 0;
      stats.totalQuestions = questionStats[0]?.total || 0;

    } else if (role === 'hod') {
      // HOD stats
      const paperStats = await query<any[]>(
        `SELECT 
          COUNT(*) as total_pending,
          SUM(CASE WHEN status = 'hod_approved' THEN 1 ELSE 0 END) as total_approved,
          SUM(CASE WHEN status = 'hod_rejected' THEN 1 ELSE 0 END) as total_rejected
        FROM exam_papers
        WHERE hod_id = ? AND deleted_at IS NULL`,
        [user_id]
      );

      const courseStats = await query<any[]>(
        `SELECT COUNT(*) as total
        FROM courses
        WHERE hod_id = ? AND deleted_at IS NULL AND is_active = TRUE`,
        [user_id]
      );

      stats.pendingApprovals = paperStats[0]?.total_pending || 0;
      stats.approvedPapers = paperStats[0]?.total_approved || 0;
      stats.rejectedPapers = paperStats[0]?.total_rejected || 0;
      stats.activeCourses = courseStats[0]?.total || 0;

    } else if (role === 'dean') {
      // Dean stats
      const paperStats = await query<any[]>(
        `SELECT 
          COUNT(*) as total_pending,
          SUM(CASE WHEN status = 'dean_approved' THEN 1 ELSE 0 END) as total_approved,
          SUM(CASE WHEN status = 'dean_rejected' THEN 1 ELSE 0 END) as total_rejected
        FROM exam_papers
        WHERE dean_id = ? AND deleted_at IS NULL`,
        [user_id]
      );

      stats.pendingApprovals = paperStats[0]?.total_pending || 0;
      stats.approvedPapers = paperStats[0]?.total_approved || 0;
      stats.rejectedPapers = paperStats[0]?.total_rejected || 0;

    } else if (role === 'admin') {
      // Admin stats
      const paperStats = await query<any[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('submitted', 'hod_review', 'dean_review') THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status IN ('ready_for_print', 'printing') THEN 1 ELSE 0 END) as ready_print,
          SUM(CASE WHEN status = 'printed' THEN 1 ELSE 0 END) as printed
        FROM exam_papers
        WHERE deleted_at IS NULL`
      );

      const userStats = await query<any[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active
        FROM users
        WHERE deleted_at IS NULL`
      );

      stats.totalPapers = paperStats[0]?.total || 0;
      stats.pendingPapers = paperStats[0]?.pending || 0;
      stats.readyForPrint = paperStats[0]?.ready_print || 0;
      stats.printedPapers = paperStats[0]?.printed || 0;
      stats.totalUsers = userStats[0]?.total || 0;
      stats.activeUsers = userStats[0]?.active || 0;
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('GET /api/stats/profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile stats', details: String(error) },
      { status: 500 }
    );
  }
}