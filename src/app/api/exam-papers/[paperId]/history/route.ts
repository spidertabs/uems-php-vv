/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/history/route.ts
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

    // Verify paper exists
    const paperResult = await query<any[]>(
      'SELECT id FROM exam_papers WHERE id = ?',
      [paperId]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Get workflow history for the paper
    const history = await query<any[]>(
      `SELECT 
        wh.*,
        CONCAT(u.first_name, ' ', u.last_name) as actor_name
      FROM workflow_history wh
      JOIN users u ON wh.actor_id = u.id
      WHERE wh.exam_paper_id = ?
      ORDER BY wh.created_at DESC`,
      [paperId]
    );

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('GET /api/exam-papers/[paperId]/history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow history', details: String(error) },
      { status: 500 }
    );
  }
}