/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/approvals/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: user_id } = session;

    // Check if user has approval permissions
    if (!['hod', 'dean', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied. Only HODs, Deans, and Admins can access approvals.' },
        { status: 403 }
      );
    }

    // Build SQL for pending papers
    let sql = `
      SELECT 
        ep.id,
        ep.paper_code,
        ep.exam_type,
        ep.status,
        ep.submitted_at,
        c.code AS course_code,
        c.title AS course_title,
        CONCAT(creator.first_name, ' ', creator.last_name) AS lecturer_name
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN users creator ON ep.created_by = creator.id
      WHERE ep.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Role-based filtering
    if (role === 'hod') {
      sql += ` AND ep.hod_id = ? AND ep.status IN ('submitted', 'hod_review')`;
      params.push(user_id);
    } else if (role === 'dean') {
      sql += ` AND ep.dean_id = ? AND ep.status IN ('hod_approved', 'dean_review')`;
      params.push(user_id);
    } else if (role === 'admin') {
      sql += ` AND ep.status IN ('submitted', 'hod_review', 'hod_approved', 'dean_review')`;
    }

    sql += ` ORDER BY ep.submitted_at DESC LIMIT 5`;

    const papers = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: papers || [],
    });
  } catch (error) {
    console.error('GET /api/approvals/pending error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals', details: String(error) },
      { status: 500 }
    );
  }
}