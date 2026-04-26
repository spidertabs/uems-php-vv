/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/students - List all students
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'hod', 'dean', 'viva_coordinator'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let queryStr = `SELECT 
        s.id, s.registration_number, s.email, s.first_name, s.last_name, s.phone,
        s.programme_id, p.name as programme_name,
        s.college_id, c.name as college_name,
        s.department_id, d.name as department_name,
        s.enrolment_year, s.study_year, s.semester, s.is_active, s.created_at
      FROM students s
      LEFT JOIN programmes p ON s.programme_id = p.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE 1=1`;
    
    const params = [];
    
    // HODs see their department's students
    if (user.role === 'hod') {
      queryStr += ` AND s.department_id = ?`;
      params.push(user.department_id);
    } else if (user.role === 'dean') {
      queryStr += ` AND s.college_id = ?`;
      params.push(user.college_id);
    }
    
    queryStr += ` ORDER BY s.registration_number DESC`;

    const students = await query<any[]>(queryStr, params);

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create new student
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      registration_number,
      email,
      password,
      first_name,
      last_name,
      phone,
      programme_id,
      college_id,
      department_id,
      enrolment_year,
      study_year,
      semester
    } = body;

    if (!registration_number || !email || !password || !first_name || !last_name || !programme_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query<any>(
      `INSERT INTO students (
        registration_number, email, password_hash, first_name, last_name, phone,
        programme_id, college_id, department_id, enrolment_year, study_year, semester, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        registration_number, email, hashedPassword, first_name, last_name, phone || null,
        programme_id, college_id || null, department_id || null, 
        enrolment_year || new Date().getFullYear(), study_year || 1, semester || 1
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      id: result.insertId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
  }
}
