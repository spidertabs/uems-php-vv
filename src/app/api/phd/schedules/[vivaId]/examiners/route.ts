// src/app/api/phd/schedules/[vivaId]/examiners/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifyExaminerAssigned } from '@/lib/phd/notifications';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);

    const examiners = await query<any[]>(
      `SELECT ve.id, ve.viva_id, ve.examiner_id, ve.role, 
              ve.confirmed, ve.confirmed_at, ve.notified_at,
              u.email, u.first_name, u.last_name
       FROM viva_examiners ve
       JOIN staff u ON ve.examiner_id = u.id
       WHERE ve.viva_id = ?
       ORDER BY ve.role, u.last_name`,
      [vivaId]
    );

    return NextResponse.json(examiners);
  } catch (error) {
    console.error('Error fetching examiners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examiners' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ vivaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vivaId: vivaIdStr } = await context.params;
    const vivaId = parseInt(vivaIdStr);
    const body = await req.json();
    const { examiner_id: examiner_id_raw, role } = body;
    const examiner_id = parseInt(examiner_id_raw);

    if (!examiner_id || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validRoles = ['chairperson', 'internal_examiner', 'external_examiner'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check viva exists
    const viva = await query<any[]>(
      'SELECT id FROM viva_schedules WHERE id = ?',
      [vivaId]
    );

    if (!viva || viva.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Check examiner exists and is eligible (not HOD or candidate)
    const eligibleExaminer = await query<any[]>(
      `SELECT u.id FROM staff u 
       LEFT JOIN students st ON u.email = st.email
       LEFT JOIN phd_candidates pc ON st.registration_number = pc.registration_number
       WHERE u.id = ? AND u.role != 'hod' AND pc.id IS NULL AND u.deleted_at IS NULL`,
      [examiner_id]
    );
    if (!eligibleExaminer || eligibleExaminer.length === 0) {
      return NextResponse.json(
        { error: 'Selected user is ineligible to be an examiner (HODs and PhD candidates are excluded)' },
        { status: 400 }
      );
    }

    // Validation: max 1 chairperson
    if (role === 'chairperson') {
      const existingChairperson = await query<any[]>(
        `SELECT id FROM viva_examiners WHERE viva_id = ? AND role = 'chairperson'::examiner_role`,
        [vivaId]
      );

      if (existingChairperson && existingChairperson.length > 0) {
        return NextResponse.json(
          { error: 'A chairperson is already assigned' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate role+examiner per viva
    const existing = await query<any[]>(
      `SELECT id FROM viva_examiners WHERE viva_id = ? AND examiner_id = ? AND role = ?::examiner_role`,
      [vivaId, examiner_id, role]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This examiner is already assigned with this role' },
        { status: 400 }
      );
    }

    // Assign examiner
    const result = await query<any>(
      `INSERT INTO viva_examiners (viva_id, examiner_id, role, confirmed)
       VALUES (?, ?, ?::examiner_role, FALSE)`,
      [vivaId, examiner_id, role]
    );

    // Notify assigned examiner via centralised helper
    await notifyExaminerAssigned(vivaId, examiner_id);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
       VALUES (?, 'CREATE', 'viva_examiners', ?, CAST(? AS jsonb), NOW())`,
      [user.id, (result as any).insertId, JSON.stringify({ viva_id: vivaId, examiner_id, role })]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error assigning examiner:', error);
    return NextResponse.json(
      { error: 'Failed to assign examiner' },
      { status: 500 }
    );
  }
}
