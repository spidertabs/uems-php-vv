/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get single user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.id);

    // Users can view their own profile, admins can view anyone
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await query<any[]>(
      `SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.department_id,
        d.name as department_name,
        u.college_id,
        c.name as college_name,
        u.phone,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id = ? AND u.deleted_at IS NULL`,
      [userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.id);

    // Users can update their own profile, admins can update anyone
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      department_id,
      college_id,
      phone,
      is_active,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (email !== undefined) {
      // Check if email is already taken by another user
      const existing = await query<any[]>(
        'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
        [email, userId]
      );
      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(hashedPassword);
    }

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }

    // Only admins can change roles
    if (role !== undefined && user.role === 'admin') {
      updates.push('role = ?');
      values.push(role);
    }

    if (department_id !== undefined) {
      updates.push('department_id = ?');
      values.push(department_id);
    }

    if (college_id !== undefined) {
      updates.push('college_id = ?');
      values.push(college_id);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    // Only admins can change active status
    if (is_active !== undefined && user.role === 'admin') {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    await query(updateQuery, values);

    // Fetch updated user
    const updated = await query<any[]>(
      `SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.department_id,
        d.name as department_name,
        u.college_id,
        c.name as college_name,
        u.phone,
        u.is_active,
        u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id = ?`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updated && updated.length > 0 ? updated[0] : null,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Soft delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete users
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt(params.id);

    // Prevent deleting yourself
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete
    await query(
      'UPDATE users SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [user.id, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}