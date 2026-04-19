/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users - List all users
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view all users
    if (user.role !== 'admin') {
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
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC`,
      []
    );

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create users
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
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
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
      `INSERT INTO users (
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
      FROM users u
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