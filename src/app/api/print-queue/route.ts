/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/print-queue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session;

    // Only exam_master and admin can access print queue
    if (!['exam_master', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Access denied. Only Exam Masters can access the print queue.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let sql = `
      SELECT 
        ep.id,
        ep.paper_code,
        ep.status,
        ep.exam_type,
        ep.exam_date,
        ep.duration,
        ep.total_marks,
        ep.print_quantity,
        ep.hod_approved_at,
        ep.dean_approved_at,
        ep.printed_at,
        ep.exam_master_id,
        c.code as course_code,
        c.title as course_name,
        d.name as department_name,
        col.name as college_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes,
        GROUP_CONCAT(DISTINCT p.name ORDER BY p.code SEPARATOR ' | ') as programme_names
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN colleges col ON c.college_id = col.id
      LEFT JOIN users creator ON ep.created_by = creator.id
      LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
      LEFT JOIN programmes p ON epp.programme_id = p.id
      WHERE ep.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (statusFilter && statusFilter !== 'all') {
      sql += ` AND ep.status = ?`;
      params.push(statusFilter);
    } else {
      sql += ` AND ep.status IN ('ready_for_print', 'printing', 'printed')`;
    }

    sql += `
      GROUP BY ep.id, ep.paper_code, ep.status, ep.exam_type, ep.exam_date,
               ep.duration, ep.total_marks, ep.print_quantity, ep.hod_approved_at,
               ep.dean_approved_at, ep.printed_at, ep.exam_master_id,
               c.code, c.title, d.name, col.name,
               creator.first_name, creator.last_name
      ORDER BY 
        CASE ep.status
          WHEN 'ready_for_print' THEN 1
          WHEN 'printing' THEN 2
          WHEN 'printed' THEN 3
        END,
        ep.exam_date ASC,
        ep.created_at DESC
    `;

    const results = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: results || [],
    });
  } catch (error) {
    console.error('GET /api/print-queue error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch print queue', details: String(error) },
      { status: 500 }
    );
  }
}