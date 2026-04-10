/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all courses with related information
    const courses = await query<any[]>(`
      SELECT 
        c.*,
        d.name as department_name,
        col.name as college_name,
        col.code as college_code,
        CONCAT(u.first_name, ' ', u.last_name) as hod_name,
        (SELECT COUNT(*) FROM study_units WHERE course_id = c.id AND is_active = TRUE) as study_units_count
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN colleges col ON c.college_id = col.id
      LEFT JOIN users u ON c.hod_id = u.id
      ORDER BY c.code ASC
    `);

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HODs and admins can create courses
    if (!['hod', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      title,
      level,
      semester,
      credit_units,
      college_id,
      department_id,
      description,
      is_active = true,
    } = body;

    // Validate required fields
    if (!code || !title || !level || !semester || !credit_units) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const existing = await query<any[]>(
      'SELECT id FROM courses WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }

    // Insert course
    const result = await query<any>(
      `INSERT INTO courses 
        (code, title, level, semester, credit_units, college_id, department_id, 
         hod_id, description, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        title,
        level,
        semester,
        credit_units,
        college_id || null,
        department_id || null,
        user.role === 'hod' ? user.id : null,
        description || null,
        is_active,
      ]
    );

    // Fetch the created course
    const course = await query<any[]>(
      'SELECT * FROM courses WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({ course: course[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}