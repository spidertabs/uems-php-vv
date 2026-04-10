/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/print-queue/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only exam_master and admin can view print history
    if (!['exam_master', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Only Exam Masters can view print history.' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const examType = searchParams.get('exam_type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query
    let sql = `
      SELECT 
        ep.id,
        ep.paper_code,
        c.code as course_code,
        c.title as course_name,
        ep.exam_type,
        ep.exam_date,
        ep.printed_at,
        ep.print_quantity,
        CONCAT(u.first_name, ' ', u.last_name) as exam_master_name,
        ep.total_marks,
        ep.duration,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes,
        ep.status
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN users u ON ep.exam_master_id = u.id
      LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
      LEFT JOIN programmes p ON epp.programme_id = p.id
      WHERE ep.status IN ('printed', 'published')
        AND ep.deleted_at IS NULL
        AND ep.printed_at IS NOT NULL
    `;

    const params: any[] = [];

    // Add year filter
    if (year && !isNaN(parseInt(year))) {
      sql += ' AND YEAR(ep.printed_at) = ?';
      params.push(parseInt(year));
    }

    // Add exam type filter
    if (examType && ['TEST', 'CAT', 'FINAL'].includes(examType)) {
      sql += ' AND ep.exam_type = ?';
      params.push(examType);
    }

    sql += `
      GROUP BY ep.id, ep.paper_code, c.code, c.title, ep.exam_type,
               ep.exam_date, ep.printed_at, ep.print_quantity,
               u.first_name, u.last_name, ep.total_marks, ep.duration, ep.status
      ORDER BY ep.printed_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    // Execute query
    const history = await query<any[]>(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(DISTINCT ep.id) as total
      FROM exam_papers ep
      WHERE ep.status IN ('printed', 'published')
        AND ep.deleted_at IS NULL
        AND ep.printed_at IS NOT NULL
    `;

    const countParams: any[] = [];

    if (year && !isNaN(parseInt(year))) {
      countSql += ' AND YEAR(ep.printed_at) = ?';
      countParams.push(parseInt(year));
    }

    if (examType && ['TEST', 'CAT', 'FINAL'].includes(examType)) {
      countSql += ' AND ep.exam_type = ?';
      countParams.push(examType);
    }

    const countResult = await query<any[]>(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Calculate summary statistics
    const statsSql = `
      SELECT 
        COUNT(DISTINCT ep.id) as total_papers,
        SUM(ep.print_quantity) as total_copies,
        AVG(ep.print_quantity) as avg_copies_per_paper,
        COUNT(DISTINCT ep.exam_master_id) as total_exam_masters
      FROM exam_papers ep
      WHERE ep.status IN ('printed', 'published')
        AND ep.deleted_at IS NULL
        AND ep.printed_at IS NOT NULL
    `;

    const statsResult = await query<any[]>(statsSql, []);
    const stats = statsResult[0] || {
      total_papers: 0,
      total_copies: 0,
      avg_copies_per_paper: 0,
      total_exam_masters: 0,
    };

    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        totalPapers: stats.total_papers || 0,
        totalCopies: stats.total_copies || 0,
        avgCopiesPerPaper: Math.round(stats.avg_copies_per_paper || 0),
        totalExamMasters: stats.total_exam_masters || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch print history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch print history' },
      { status: 500 }
    );
  }
}