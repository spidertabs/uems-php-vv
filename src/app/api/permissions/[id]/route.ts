/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/permissions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/permissions/:id - Get single permission
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const { id } = await params;
    const permissionId = parseInt(id);

    const [permission] = await query<any[]>(
      `SELECT 
        lp.id,
        lp.lecturer_id,
        CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
        u.email as lecturer_email,
        lp.course_id,
        c.code as course_code,
        c.title as course_title,
        d.name as department_name,
        lp.granted_by,
        CONCAT(hod.first_name, ' ', hod.last_name) as granted_by_name,
        lp.can_add_questions,
        lp.can_create_papers,
        lp.can_edit_questions,
        lp.granted_at,
        lp.expires_at,
        lp.is_active,
        lp.notes
      FROM lecturer_permissions lp
      JOIN users u ON lp.lecturer_id = u.id
      JOIN courses c ON lp.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      JOIN users hod ON lp.granted_by = hod.id
      WHERE lp.id = ?
        AND u.deleted_at IS NULL 
        AND c.deleted_at IS NULL`,
      [permissionId]
    );

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === 'lecturer' && permission.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'hod') {
      // HOD can only view permissions they granted or in their department
      const canView = 
        permission.granted_by === user.id || 
        permission.hod_id === user.id;
      
      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (user.role === 'dean') {
      // Check if course belongs to dean's college
      const [course] = await query<any[]>(
        'SELECT college_id FROM courses WHERE id = ?',
        [permission.course_id]
      );
      
      if (!course || course.college_id !== user.college_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission' },
      { status: 500 }
    );
  }
}

// PUT /api/permissions/:id - Update permission
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const { id } = await params;
    const permissionId = parseInt(id);
    const body = await req.json();

    // Get existing permission
    const [existing] = await query<any[]>(
      'SELECT * FROM lecturer_permissions WHERE id = ?',
      [permissionId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check authorization - only HOD who granted it, dean, or admin can update
    if (user.role === 'lecturer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'hod' && existing.granted_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'dean') {
      // Check if course belongs to dean's college
      const [course] = await query<any[]>(
        'SELECT college_id FROM courses WHERE id = ?',
        [existing.course_id]
      );
      
      if (!course || course.college_id !== user.college_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.can_add_questions !== undefined) {
      updates.push('can_add_questions = ?');
      values.push(body.can_add_questions);
    }
    if (body.can_create_papers !== undefined) {
      updates.push('can_create_papers = ?');
      values.push(body.can_create_papers);
    }
    if (body.can_edit_questions !== undefined) {
      updates.push('can_edit_questions = ?');
      values.push(body.can_edit_questions);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active);
    }
    if (body.expires_at !== undefined) {
      updates.push('expires_at = ?');
      values.push(body.expires_at);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    values.push(permissionId);

    await query(
      `UPDATE lecturer_permissions 
       SET ${updates.join(', ')} 
       WHERE id = ?`,
      values
    );

    // Get updated permission
    const [updated] = await query<any[]>(
      `SELECT 
        lp.id,
        lp.lecturer_id,
        CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
        u.email as lecturer_email,
        lp.course_id,
        c.code as course_code,
        c.title as course_title,
        lp.granted_by,
        CONCAT(hod.first_name, ' ', hod.last_name) as granted_by_name,
        lp.can_add_questions,
        lp.can_create_papers,
        lp.can_edit_questions,
        lp.granted_at,
        lp.expires_at,
        lp.is_active,
        lp.notes
      FROM lecturer_permissions lp
      JOIN users u ON lp.lecturer_id = u.id
      JOIN courses c ON lp.course_id = c.id
      JOIN users hod ON lp.granted_by = hod.id
      WHERE lp.id = ?`,
      [permissionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Permission updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// DELETE /api/permissions/:id - Revoke permission
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const { id } = await params;
    const permissionId = parseInt(id);

    // Get existing permission
    const [existing] = await query<any[]>(
      'SELECT * FROM lecturer_permissions WHERE id = ?',
      [permissionId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check authorization - only HOD who granted it, dean, or admin can revoke
    if (user.role === 'lecturer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'hod' && existing.granted_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'dean') {
      // Check if course belongs to dean's college
      const [course] = await query<any[]>(
        'SELECT college_id FROM courses WHERE id = ?',
        [existing.course_id]
      );
      
      if (!course || course.college_id !== user.college_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Soft delete by setting is_active to false and adding revoked_at timestamp
    await query(
      `UPDATE lecturer_permissions 
       SET is_active = FALSE, 
           updated_at = NOW(),
           notes = CONCAT(IFNULL(notes, ''), '\nRevoked by ', ?)
       WHERE id = ?`,
      [user.email, permissionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Permission revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking permission:', error);
    return NextResponse.json(
      { error: 'Failed to revoke permission' },
      { status: 500 }
    );
  }
}