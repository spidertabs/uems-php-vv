/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all departments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collegeId = searchParams.get('college_id');

    let sql = `
      SELECT 
        d.*,
        c.name as college_name,
        c.abbrv as college_abbrv
      FROM departments d
      LEFT JOIN colleges c ON d.college_id = c.id
    `;

    const params: any[] = [];

    if (collegeId) {
      sql += ' WHERE d.college_id = ?';
      params.push(collegeId);
    }

    sql += ' ORDER BY d.name';

    const departments = await query(sql, params);

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST - Create new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, abbrv, description, college_id } = body;

    // Validate required fields
    if (!code || !name || !abbrv || !college_id) {
      return NextResponse.json(
        { error: 'Code, name, abbreviation, and college are required' },
        { status: 400 }
      );
    }

    // Check if college exists
    const college = await query(
      'SELECT id FROM colleges WHERE id = ?',
      [college_id]
    );

    if (college.length === 0) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check for duplicates
    const existing = await query(
      'SELECT id FROM departments WHERE code = ? OR name = ? OR abbrv = ?',
      [code, name, abbrv]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Department with this code, name, or abbreviation already exists' },
        { status: 409 }
      );
    }

    // Insert department
    const result = await query(
      `INSERT INTO departments (code, name, abbrv, description, college_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [code, name, abbrv, description || null, college_id]
    );

    const newDepartment = await query(
      `SELECT d.*, c.name as college_name, c.abbrv as college_abbrv
       FROM departments d
       LEFT JOIN colleges c ON d.college_id = c.id
       WHERE d.id = ?`,
      [result.insertId]
    );

    return NextResponse.json(
      { message: 'Department created successfully', department: newDepartment[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}