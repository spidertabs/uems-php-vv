/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/notifications/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/notifications/history - Get workflow history
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get history based on user role
    let historyQuery = `
      SELECT 
        wh.id,
        wh.exam_paper_id,
        ep.paper_code,
        wh.action,
        wh.from_status,
        wh.to_status,
        wh.comments,
        wh.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as actor_name,
        u.role as actor_role
      FROM workflow_history wh
      JOIN exam_papers ep ON wh.exam_paper_id = ep.id
      JOIN users u ON wh.actor_id = u.id
      WHERE ep.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (user.role === 'lecturer') {
      // Lecturer sees history of their own papers
      historyQuery += ` AND ep.created_by = ?`;
      params.push(user.id);
    } else if (user.role === 'hod') {
      // HOD sees history of papers in their department
      historyQuery += ` AND ep.hod_id = ?`;
      params.push(user.id);
    } else if (user.role === 'dean') {
      // Dean sees history of papers in their college
      historyQuery += ` AND EXISTS (
        SELECT 1 FROM courses c 
        WHERE c.id = ep.course_id AND c.college_id = ?
      )`;
      params.push(user.college_id);
    } else if (user.role === 'exam_master') {
      // Exam Master sees history of papers they're handling
      historyQuery += ` AND (
        ep.exam_master_id = ? OR 
        ep.status IN ('ready_for_print', 'printing', 'printed', 'published')
      )`;
      params.push(user.id);
    }
    // Admin sees all history (no filter)

    historyQuery += ` ORDER BY wh.created_at DESC LIMIT 100`;

    const history = await query<any[]>(historyQuery, params);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}