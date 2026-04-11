/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifyVivaScheduled } from '@/lib/phd/notifications';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const candidateId = searchParams.get('candidate_id');

    let sql = `
      SELECT vs.id, vs.candidate_id, vs.thesis_id, vs.scheduled_date, 
             vs.scheduled_time, vs.venue, vs.duration_minutes, vs.status,
             vs.created_at, vs.updated_at,
             pc.registration_number, u.first_name, u.last_name,
             p.name AS programme_name
      FROM viva_schedules vs
      JOIN phd_candidates pc ON vs.candidate_id = pc.id
      JOIN users u ON pc.user_id = u.id
      JOIN programmes p ON pc.programme_id = p.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (status) {
      sql += ' AND vs.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      sql += ' AND vs.scheduled_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ' AND vs.scheduled_date <= ?';
      params.push(dateTo);
    }

    if (candidateId) {
      sql += ' AND vs.candidate_id = ?';
      params.push(parseInt(candidateId));
    }

    sql += ' ORDER BY vs.scheduled_date DESC';

    const schedules = await query<any[]>(sql, params);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      candidate_id,
      thesis_id,
      scheduled_date,
      scheduled_time,
      venue,
      duration_minutes,
    } = body;

    if (!candidate_id || !thesis_id || !scheduled_date || !scheduled_time || !venue || !duration_minutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const candidate = await query<any[]>(
      'SELECT id, user_id FROM phd_candidates WHERE id = ?',
      [candidate_id]
    );

    if (!candidate || candidate.length === 0) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Verify thesis exists for this candidate
    const thesis = await query<any[]>(
      'SELECT id FROM thesis_submissions WHERE id = ? AND candidate_id = ?',
      [thesis_id, candidate_id]
    );

    if (!thesis || thesis.length === 0) {
      return NextResponse.json(
        { error: 'Thesis not found for this candidate' },
        { status: 404 }
      );
    }

    // Create schedule
    const result = await query<any>(
      `INSERT INTO viva_schedules 
       (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled', NOW(), NOW())`,
      [candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes]
    );

    // Trigger will auto-update candidate status to 'viva_scheduled'

    // Notify candidate, supervisor, and any already-assigned examiners via centralised helper
    await notifyVivaScheduled((result as any).insertId);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at)
       VALUES (?, 'CREATE', 'viva_schedules', ?, ?, NOW())`,
      [user.id, (result as any).insertId, JSON.stringify({ candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes })]
    );

    return NextResponse.json({ id: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
