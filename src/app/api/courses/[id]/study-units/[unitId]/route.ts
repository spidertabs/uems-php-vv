/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/courses/[id]/study-units/[unitId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, unitId } = await params;

    const rows = await query<any[]>(
      `SELECT 
        su.*,
        c.code as course_code,
        c.title as course_title,
        (SELECT COUNT(*) FROM questions q WHERE q.study_unit_id = su.id) as questions_count
       FROM study_units su
       LEFT JOIN courses c ON su.course_id = c.id
       WHERE su.id = ? AND su.course_id = ?
       LIMIT 1`,
      [unitId, courseId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Study unit not found' }, { status: 404 });
    }

    return NextResponse.json({ studyUnit: rows[0] });
  } catch (error) {
    console.error('Get study unit error:', error);
    return NextResponse.json({ error: 'Failed to fetch study unit' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, unitId } = await params;
    const body = await request.json();

    const { unit_code, unit_name, description, order_index, is_active } = body;

    // Validate required fields
    if (!unit_code || !unit_name || order_index === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await query(
      `UPDATE study_units 
       SET unit_code = ?, unit_name = ?, description = ?, order_index = ?, 
           is_active = ?, updated_at = NOW()
       WHERE id = ? AND course_id = ?`,
      [unit_code, unit_name, description || null, order_index, is_active ? 1 : 0, unitId, courseId]
    );

    return NextResponse.json({ message: 'Study unit updated successfully' });
  } catch (error) {
    console.error('Update study unit error:', error);
    return NextResponse.json({ error: 'Failed to update study unit' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, unitId } = await params;

    // Delete the study unit (questions will be handled by foreign key constraints)
    await query('DELETE FROM study_units WHERE id = ? AND course_id = ?', [unitId, courseId]);

    return NextResponse.json({ message: 'Study unit deleted successfully' });
  } catch (error) {
    console.error('Delete study unit error:', error);
    return NextResponse.json({ error: 'Failed to delete study unit' }, { status: 500 });
  }
}