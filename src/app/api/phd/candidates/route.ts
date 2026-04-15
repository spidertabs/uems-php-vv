/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const programmeId = searchParams.get('programme_id');
    const supervisorId = searchParams.get('supervisor_id');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');

    let sql = `
      SELECT 
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
      LEFT JOIN users s ON pc.supervisor_id = s.id
      WHERE pc.deleted_at IS NULL
    `;

    const params: (string | number)[] = [];

    if (status) {
      sql += ' AND pc.status = ?';
      params.push(status);
    }

    if (programmeId) {
      sql += ' AND pc.programme_id = ?';
      params.push(parseInt(programmeId));
    }

    if (supervisorId) {
      sql += ' AND pc.supervisor_id = ?';
      params.push(parseInt(supervisorId));
    }

    if (search) {
      sql += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR pc.registration_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY pc.created_at DESC';

    // Add limit if specified and it's a number or 'all'
    if (limit && limit !== 'all') {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        sql += ' LIMIT ?';
        params.push(limitNum);
      }
    }

    const candidates = await query<any[]>(sql, params);
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
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
      user_id,
      registration_number,
      thesis_title,
      programme_id,
      supervisor_id,
      co_supervisor_id,
      enrolment_year,
    } = body;

    // Validation
    if (!user_id || !registration_number || !thesis_title || !programme_id || !supervisor_id || !enrolment_year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate registration number
    const existing = await query<any[]>(
      'SELECT id FROM phd_candidates WHERE registration_number = ?',
      [registration_number]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Registration number already exists' },
        { status: 400 }
      );
    }

    // Check programme level is PhD
    const prog = await query<any[]>(
      'SELECT level FROM programmes WHERE id = ?',
      [programme_id]
    );

    if (!prog || prog.length === 0 || prog[0].level !== 'phd') {
      return NextResponse.json(
        { error: 'Programme must be a PhD level programme' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      `INSERT INTO phd_candidates 
       (user_id, registration_number, thesis_title, programme_id, supervisor_id, 
        co_supervisor_id, status, enrolment_year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'enrolled', ?, NOW(), NOW())`,
      [user_id, registration_number, thesis_title, programme_id, supervisor_id, co_supervisor_id || null, enrolment_year]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, changes, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [user.id, 'CREATE', 'phd_candidates', (result as any).insertId, JSON.stringify(body)]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
