/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/programmes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth';
import { logAuditFromRequest, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';
import type { Programme } from '@/types';

// GET single programme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const programmes = await query<Programme[]>(
      `SELECT 
        p.*,
        d.name as department_name,
        d.code as department_code,
        c.name as college_name,
        c.code as college_code,
        c.id as college_id,
        (SELECT COUNT(*) FROM courses WHERE programme_id = p.id) as course_count
      FROM programmes p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN colleges c ON p.college_id = c.id
      WHERE p.id = ?`,
      [params.id]
    );

    if (programmes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Programme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: programmes[0],
      programme: programmes[0],
    });
  } catch (error) {
    console.error('Error fetching programme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programme' },
      { status: 500 }
    );
  }
}

// PUT update programme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get old values for audit
    const oldData = await query<Programme[]>(
      'SELECT * FROM programmes WHERE id = ?',
      [params.id]
    );

    if (oldData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Programme not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      level,
      duration_years,
      department_id,
      college_id,
      description,
      is_active,
    } = body;

    // Validate level if provided
    if (level) {
      const validLevels = ['diploma', 'bachelors', 'masters', 'phd'];
      if (!validLevels.includes(level)) {
        return NextResponse.json(
          { success: false, error: 'Invalid level. Must be: diploma, bachelors, masters, or phd' },
          { status: 400 }
        );
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (code !== undefined) {
      // Check for duplicate code (excluding current programme)
      const existing = await query<Programme[]>(
        'SELECT id FROM programmes WHERE code = ? AND id != ?',
        [code, params.id]
      );
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Programme code already exists' },
          { status: 409 }
        );
      }
      updates.push('code = ?');
      values.push(code);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (level !== undefined) {
      updates.push('level = ?');
      values.push(level);
    }
    if (duration_years !== undefined) {
      updates.push('duration_years = ?');
      values.push(duration_years);
    }
    if (department_id !== undefined) {
      updates.push('department_id = ?');
      values.push(department_id);
    }
    if (college_id !== undefined) {
      updates.push('college_id = ?');
      values.push(college_id);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id);

    await query(
      `UPDATE programmes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Log audit
    await logAuditFromRequest(request, {
      userId: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITIES.PROGRAMME,
      entityId: parseInt(params.id),
      oldValues: oldData[0],
      newValues: body,
    });

    // Fetch updated programme
    const updated = await query<Programme[]>(
      `SELECT 
        p.*,
        d.name as department_name,
        c.name as college_name
      FROM programmes p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN colleges c ON p.college_id = c.id
      WHERE p.id = ?`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: updated[0],
      programme: updated[0],
      message: 'Programme updated successfully',
    });
  } catch (error) {
    console.error('Error updating programme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update programme' },
      { status: 500 }
    );
  }
}

// DELETE programme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get programme data for audit
    const programmes = await query<Programme[]>(
      'SELECT * FROM programmes WHERE id = ?',
      [params.id]
    );

    if (programmes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Programme not found' },
        { status: 404 }
      );
    }

    // Check if programme has courses
    const courses = await query<any[]>(
      'SELECT COUNT(*) as count FROM courses WHERE programme_id = ?',
      [params.id]
    );

    if (courses[0].count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete programme with ${courses[0].count} associated courses`,
        },
        { status: 400 }
      );
    }

    await query('DELETE FROM programmes WHERE id = ?', [params.id]);

    // Log audit
    await logAuditFromRequest(request, {
      userId: user.id,
      action: AUDIT_ACTIONS.DELETE,
      entityType: AUDIT_ENTITIES.PROGRAMME,
      entityId: parseInt(params.id),
      oldValues: programmes[0],
    });

    return NextResponse.json({
      success: true,
      message: 'Programme deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting programme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete programme' },
      { status: 500 }
    );
  }
}