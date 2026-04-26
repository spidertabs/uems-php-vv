/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod', 'lecturer'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { candidateId: candidateIdStr } = await context.params;
    const candidateId = parseInt(candidateIdStr);

    const rows = await query<any[]>(
      `SELECT 
        pc.id, pc.registration_number, 
        pc.thesis_title, pc.programme_id, pc.supervisor_id, 
        pc.co_supervisor_id, pc.status, pc.enrolment_year,
        pc.created_at, pc.updated_at,
        CONCAT(st.first_name, ' ', st.last_name) AS candidate_name_full,
        COALESCE(CONCAT(st.first_name, ' ', st.last_name), pc.registration_number) AS candidate_name,
        st.email AS candidate_email,
        p.name AS programme_name,
        p.code AS programme_code,
        CONCAT(s.first_name, ' ', s.last_name) AS supervisor_name,
        s.email AS supervisor_email,
        cs.first_name AS co_sup_first,
        cs.last_name AS co_sup_last
      FROM phd_candidates pc
      LEFT JOIN students st ON pc.registration_number = st.registration_number
      JOIN programmes p ON pc.programme_id = p.id
      LEFT JOIN staff s ON pc.supervisor_id = s.id
      LEFT JOIN staff cs ON pc.co_supervisor_id = cs.id
      WHERE pc.id = ? AND pc.deleted_at IS NULL`,
      [candidateId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const row = rows[0];

    // Permission check for lecturers: only allow viewing assigned candidates
    if (user.role === 'lecturer') {
      if (!hasPermission(user, 'view_candidate_details')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Verify lecturer is supervisor or co-supervisor
      if (row.supervisor_id !== user.id && row.co_supervisor_id !== user.id) {
        return NextResponse.json(
          { error: 'You are not authorized to view this candidate' },
          { status: 403 }
        );
      }
    }

    const candidate = {
      ...row,
      co_supervisor_name:
        row.co_sup_first && row.co_sup_last
          ? `${row.co_sup_first} ${row.co_sup_last}`
          : null,
    };

    return NextResponse.json({ candidate });
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
      'programme_id',
      'supervisor_id',
      'co_supervisor_id'
    ];

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === 'status') {
          updates.push(`${key} = ?::candidate_status`);
        } else {
          updates.push(`${key} = ?`);
        }
        values.push(value as string | number | null);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validate Supervisor eligibility if they are being updated
    const supsToValidate: number[] = [];
    if (body.supervisor_id) supsToValidate.push(body.supervisor_id);
    if (body.co_supervisor_id) supsToValidate.push(body.co_supervisor_id);

    if (supsToValidate.length > 0) {
      const ineligible = await query<any[]>(
        `SELECT u.id FROM staff u 
         WHERE u.id IN (${supsToValidate.map(() => '?').join(',')}) 
           AND u.role = 'hod'`,
        supsToValidate
      );

      if (ineligible.length > 0) {
        return NextResponse.json(
          { error: 'One or more selected supervisors are ineligible' },
          { status: 400 }
        );
      }
    }

    updates.push('updated_at = NOW()');
    values.push(candidateId);

    await query(
      `UPDATE phd_candidates SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES (?, ?, ?, ?, CAST(? AS jsonb), NOW())`,
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
