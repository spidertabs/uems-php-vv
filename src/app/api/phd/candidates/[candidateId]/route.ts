/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { candidateId: candidateIdStr } = await context.params;
    const candidateId = parseInt(candidateIdStr);

    const candidate = await query<any[]>(
      `SELECT 
        pc.id, pc.user_id, pc.registration_number, 
        pc.thesis_title, pc.programme_id, pc.supervisor_id, 
        pc.co_supervisor_id, pc.status, pc.enrolment_year,
        pc.created_at, pc.updated_at,
        u.email, u.first_name, u.last_name,
        p.name AS programme_name,
        s.first_name AS supervisor_first_name, 
        s.last_name AS supervisor_last_name
      FROM phd_candidates pc
      JOIN users u ON pc.user_id = u.id
      JOIN programmes p ON pc.programme_id = p.id
      JOIN users s ON pc.supervisor_id = s.id
      WHERE pc.id = ?`,
      [candidateId]
    );

    if (candidate.length === 0) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate[0]);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { candidateId: candidateIdStr } = await context.params;
    const candidateId = parseInt(candidateIdStr);
    const body = await req.json();

    // Only allow updating certain fields
    const allowedFields = [
      'thesis_title',
      'status',
      'co_supervisor_id',
      'supervisor_id'
    ];

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value as string | number | null);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    values.push(candidateId);

    await query(
      `UPDATE phd_candidates SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, changes, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [user.id, 'UPDATE', 'phd_candidates', candidateId, JSON.stringify(body)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}
