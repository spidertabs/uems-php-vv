/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ thesisId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { thesisId: thesisIdStr } = await context.params;
    const thesisId = parseInt(thesisIdStr);

    const thesis = await query<any[]>(
      `SELECT id, candidate_id, version, file_name, file_path, file_size_kb, 
              submission_notes, submitted_at
       FROM thesis_submissions
       WHERE id = ?`,
      [thesisId]
    );

    if (!thesis || thesis.length === 0) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(thesis[0]);
  } catch (error) {
    console.error('Error fetching thesis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thesis' },
      { status: 500 }
    );
  }
}
