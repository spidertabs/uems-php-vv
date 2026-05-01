// src/app/api/phd/schedules/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifyVivaScheduled } from '@/lib/phd/notifications';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod', 'dean', 'lecturer', 'professor', 'external_examiner'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isLecturer = ['lecturer', 'professor', 'external_examiner'].includes(user.role);
    const userId = user.id;

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const candidateId = searchParams.get('candidate_id');
    const limit = searchParams.get('limit');

    let sql = `
      SELECT vs.id AS viva_id, vs.candidate_id, vs.thesis_id, vs.scheduled_date, 
             vs.scheduled_time, vs.venue, vs.duration_minutes, 
             vs.status AS viva_status,
             vs.created_at, vs.updated_at,
             pc.registration_number, 
             pc.thesis_title,
             pc.status AS candidate_status,
             COALESCE(CONCAT(st.first_name, ' ', st.last_name), pc.registration_number) AS candidate_name,
             CONCAT(COALESCE(sup.first_name, ''), ' ', COALESCE(sup.last_name, '')) AS supervisor_name,
             p.name AS programme_name,
             COALESCE(vr.outcome, NULL) AS outcome,
             (SELECT COUNT(*) FROM viva_examiners WHERE viva_id = vs.id AND confirmed = TRUE) AS confirmed_examiners,
             (SELECT COUNT(*) FROM viva_examiners WHERE viva_id = vs.id) AS total_examiners,
             (SELECT COUNT(*) FROM viva_evaluations WHERE viva_id = vs.id AND is_submitted = TRUE) AS evaluations_submitted
      FROM viva_schedules vs
      JOIN phd_candidates pc ON vs.candidate_id = pc.id
      LEFT JOIN students st ON pc.registration_number = st.registration_number
      JOIN programmes p ON pc.programme_id = p.id
      LEFT JOIN staff sup ON pc.supervisor_id = sup.id
      LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
      WHERE pc.deleted_at IS NULL
    `;

    const params: (string | number)[] = [];

    // Filter by department for HODs
    if (user.role === 'hod' && user.department_id) {
      sql += ' AND p.department_id = ?';
      params.push(user.department_id);
    }

    // Filter by assignments for lecturers
    if (isLecturer) {
      sql += ` AND (
        pc.supervisor_id = ? OR 
        pc.co_supervisor_id = ? OR 
        pc.id IN (SELECT pcs.candidate_id FROM phd_candidate_supervisors pcs WHERE pcs.supervisor_id = ?) OR
        vs.id IN (SELECT ve.viva_id FROM viva_examiners ve WHERE ve.examiner_id = ?)
      )`;
      params.push(userId, userId, userId, userId);
    }

    if (status) {
      sql += ' AND vs.status = ?::text::viva_status';
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

    // Add limit if specified
    if (limit && limit !== 'all') {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        sql += ' LIMIT ?';
        params.push(limitNum);
      }
    }

    const schedules = await query<any[]>(sql, params);
    return NextResponse.json({ schedules });
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

    // 1. Initial validation
    if (!candidate_id || !thesis_id || !scheduled_date || !scheduled_time || !venue || !duration_minutes) {
      return NextResponse.json(
        { error: 'Missing required scheduling information' },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate active schedules
    const existing = await query<any[]>(
      'SELECT id FROM viva_schedules WHERE candidate_id = ? AND status = \'scheduled\'',
      [parseInt(candidate_id)]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Candidate already has an active viva session scheduled' },
        { status: 400 }
      );
    }

    // 3. Verify thesis-candidate relationship
    const thesis = await query<any[]>(
      'SELECT id FROM thesis_submissions WHERE id = ? AND candidate_id = ?',
      [parseInt(thesis_id), parseInt(candidate_id)]
    );

    if (thesis.length === 0) {
      return NextResponse.json(
        { error: 'Specified thesis not found for this candidate' },
        { status: 404 }
      );
    }

    // 4. Create schedule
    console.log(`📝 Creating viva for candidate ${candidate_id} by user ${user.id}`);
    
    // Explicitly cast to ensure correct DB mapping
    const result = await query<any>(
      `INSERT INTO viva_schedules 
       (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?::date, ?::time, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [
        parseInt(candidate_id),
        parseInt(thesis_id),
        scheduled_date,
        scheduled_time,
        venue,
        parseInt(duration_minutes),
        user.id
      ]
    );

    const vivaId = result.insertId;

    if (!vivaId) {
      throw new Error('Database failed to return a new schedule ID.');
    }

    // 5. Audit Logging
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
       VALUES (?, 'CREATE', 'viva_schedules', ?, CAST(? AS jsonb), NOW())`,
      [
        user.id,
        vivaId,
        JSON.stringify({
          candidate_id,
          thesis_id,
          scheduled_date,
          scheduled_time,
          venue,
          duration_minutes
        })
      ]
    );

    // 6. Notifications (Non-blocking but awaited)
    try {
      await notifyVivaScheduled(vivaId);
    } catch (notifErr) {
      console.error('⚠️ Notification failed (viva created successfully):', notifErr);
    }

    return NextResponse.json({ 
      viva_id: vivaId,
      message: 'Viva session scheduled successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Critical Error in PhD Schedule API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while scheduling the viva' },
      { status: 500 }
    );
  }
}
