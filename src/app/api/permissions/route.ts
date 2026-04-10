/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// GET /api/permissions - List all permissions
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query based on user role
    let permissionsQuery = `
      SELECT 
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
      WHERE u.deleted_at IS NULL 
        AND c.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Filter based on role
    if (user.role === 'hod') {
      // HOD sees permissions they granted or in their department
      permissionsQuery += ` AND (lp.granted_by = ? OR c.hod_id = ?)`;
      params.push(user.id, user.id);
    } else if (user.role === 'lecturer') {
      // Lecturers only see their own permissions
      permissionsQuery += ` AND lp.lecturer_id = ?`;
      params.push(user.id);
    } else if (user.role === 'dean') {
      // Dean sees all permissions in their college
      permissionsQuery += ` AND c.college_id = ?`;
      params.push(user.college_id);
    }
    // Admin sees all permissions (no additional filter)

    permissionsQuery += ` ORDER BY lp.granted_at DESC`;

    const permissions = await query<any[]>(permissionsQuery, params);

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}