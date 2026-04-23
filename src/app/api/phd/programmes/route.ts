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

    // Get all PhD level programmes
    let sql = `SELECT id, code, name FROM programmes WHERE level = 'phd' AND is_active = TRUE`;
    const params: any[] = [];

    if (user.role === 'hod' && user.department_id) {
      sql += ' AND department_id = ?';
      params.push(user.department_id);
    }

    sql += ' ORDER BY name ASC';
    const programmes = await query<any[]>(sql, params);

    return NextResponse.json({ programmes });
  } catch (error) {
    console.error('Error fetching PhD programmes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PhD programmes' },
      { status: 500 }
    );
  }
}
