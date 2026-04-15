/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod', 'dean'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all programmes that have PhD candidates
    const programmes = await query<any[]>(
      `SELECT DISTINCT p.id, p.code, p.name
       FROM programmes p
       INNER JOIN phd_candidates pc ON p.id = pc.programme_id
       WHERE pc.deleted_at IS NULL
       ORDER BY p.name ASC`
    );

    return NextResponse.json({ programmes });
  } catch (error) {
    console.error('Error fetching PhD programmes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PhD programmes' },
      { status: 500 }
    );
  }
}
