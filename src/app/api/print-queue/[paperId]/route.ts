// ============================================================
// FILE 1: src/app/api/print-queue/[paperId]/route.ts
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session;
    if (!['exam_master', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // CRITICAL FIX: Await the params object
    const { paperId } = await params;
    const paperIdNum = parseInt(paperId);

    console.log('Fetching paper from print queue:', paperIdNum);

    const sql = `
      SELECT 
        ep.*,
        c.code as course_code,
        c.title as course_title,
        d.name as department_name,
        col.name as college_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        CONCAT(hod.first_name, ' ', hod.last_name) as hod_name,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN colleges col ON c.college_id = col.id
      LEFT JOIN users creator ON ep.created_by = creator.id
      LEFT JOIN users hod ON ep.hod_id = hod.id
      LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
      LEFT JOIN programmes p ON epp.programme_id = p.id
      WHERE ep.id = ? 
        AND ep.deleted_at IS NULL
        AND ep.status IN ('ready_for_print', 'printing', 'printed')
      GROUP BY ep.id
    `;

    const results = await query<any[]>(sql, [paperIdNum]);

    console.log('Query results:', results?.length || 0, 'papers found');

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('GET /api/print-queue/[paperId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper details', details: String(error) },
      { status: 500 }
    );
  }
}