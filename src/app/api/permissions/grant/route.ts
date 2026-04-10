/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/permissions/grant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST /api/permissions/grant - Grant new permission
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HOD and Admin can grant permissions
    if (user.role !== 'hod' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      lecturer_id,
      course_id,
      can_add_questions = true,
      can_create_papers = true,
      can_edit_questions = false,
      expires_at = null,
      notes = null,
    } = body;

    // Validation
    if (!lecturer_id || !course_id) {
      return NextResponse.json(
        { error: 'Lecturer and course are required' },
        { status: 400 }
      );
    }

    // Verify lecturer exists and is actually a lecturer
    const [lecturer] = await query<any[]>(
      `SELECT id, role FROM users 
       WHERE id = ? AND role = 'lecturer' AND deleted_at IS NULL`,
      [lecturer_id]
    );

    if (!lecturer) {
      return NextResponse.json(
        { error: 'Invalid lecturer ID or user is not a lecturer' },
        { status: 400 }
      );
    }

    // Verify course exists
    const [course] = await query<any[]>(
      'SELECT id, hod_id, department_id FROM courses WHERE id = ? AND deleted_at IS NULL',
      [course_id]
    );

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // If HOD, verify they own this course
    if (user.role === 'hod' && course.hod_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only grant permissions for your own courses' },
        { status: 403 }
      );
    }

    // Check if permission already exists
    const existing = await query<any[]>(
      `SELECT id FROM lecturer_permissions 
       WHERE lecturer_id = ? AND course_id = ?`,
      [lecturer_id, course_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Permission already exists for this lecturer-course combination' },
        { status: 409 }
      );
    }

    // Insert permission
    const result = await query<any>(
      `INSERT INTO lecturer_permissions (
        lecturer_id,
        course_id,
        granted_by,
        can_add_questions,
        can_create_papers,
        can_edit_questions,
        expires_at,
        notes,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        lecturer_id,
        course_id,
        user.id,
        can_add_questions,
        can_create_papers,
        can_edit_questions,
        expires_at,
        notes,
      ]
    );

    // Create notification for lecturer
    await query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority
      ) VALUES (?, 'permission_granted', ?, ?, 'medium')`,
      [
        lecturer_id,
        'Permission Granted',
        `You have been granted permissions for ${course.code || 'a course'}`,
      ]
    );

    // Fetch created permission with details
    const [newPermission] = await query<any[]>(
      `SELECT 
        lp.id,
        lp.lecturer_id,
        CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
        lp.course_id,
        c.code as course_code,
        c.title as course_title,
        lp.can_add_questions,
        lp.can_create_papers,
        lp.can_edit_questions,
        lp.granted_at,
        lp.expires_at,
        lp.is_active
      FROM lecturer_permissions lp
      JOIN users u ON lp.lecturer_id = u.id
      JOIN courses c ON lp.course_id = c.id
      WHERE lp.id = ?`,
      [result.insertId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Permission granted successfully',
        data: newPermission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error granting permission:', error);
    return NextResponse.json(
      { error: 'Failed to grant permission' },
      { status: 500 }
    );
  }
}