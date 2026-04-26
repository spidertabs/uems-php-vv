/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/staff/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/staff - List all staff
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins, HODs, and Deans can view staff
    if (!['admin', 'hod', 'dean'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let queryStr = `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, 
        u.department_id, d.name as department_name,
        u.college_id, c.name as college_name,
        u.phone, u.is_active, u.created_at
      FROM staff u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.deleted_at IS NULL`;
    
    const params = [];
    
    if (user.role !== 'admin') {
      queryStr += ` AND u.department_id = ?`;
      params.push(user.department_id);
    }
    
    queryStr += ` ORDER BY u.first_name ASC`;

    const staff = await query<any[]>(queryStr, params);

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new user
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create staff
    if (user.role !== 'admin') {
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
    } = body;

    // Validation
    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await query<any[]>(
      'SELECT id FROM staff WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query<any>(
      `INSERT INTO staff (
        email,
        password_hash,
        first_name,
        last_name,
        role,
        department_id,
        college_id,
        phone,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        email,
        hashedPassword,
        first_name,
        last_name,
        role,
        department_id || null,
        college_id || null,
        phone || null,
      ]
    );

    // Fetch created user
    const newUser = await query<any[]>(
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
        u.created_at
      FROM staff u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: newUser[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}