/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/workflow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    // Fetch workflow history
    const sql = `
      SELECT 
        wh.*,
        CONCAT(u.first_name, ' ', u.last_name) AS actor_name
      FROM workflow_history wh
      LEFT JOIN users u ON wh.actor_id = u.id
      WHERE wh.exam_paper_id = ?
      ORDER BY wh.created_at DESC
    `;

    const history = await query<any[]>(sql, [paperId]);

    return NextResponse.json({
      success: true,
      history: history || [],
    });
  } catch (error) {
    console.error('GET /api/exam-papers/[paperId]/workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow history', details: String(error) },
      { status: 500 }
    );
  }
}