// src/app/api/colleges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all colleges
export async function GET() {
  try {
    const colleges = await query(`
      SELECT 
    c.id,
    c.code,
    c.name,
    c.description,
    c.created_at,
    c.updated_at,
    COUNT(d.id) AS departments_count
  FROM colleges c
  LEFT JOIN departments d ON d.college_id = c.id
  GROUP BY 
    c.id,
    c.code,
    c.name,
    c.description,
    c.created_at,
    c.updated_at
  ORDER BY c.name
    `);

    return NextResponse.json({ colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}

// POST - Create new college
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check for duplicates
    const existing = await query(
      'SELECT id FROM colleges WHERE code = ? OR name = ?',
      [code, name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'College with this code or name already exists' },
        { status: 409 }
      );
    }

    // Insert college
    const result = await query(
      `INSERT INTO colleges (code, name, description) 
       VALUES (?, ?, ?)`,
      [code, name, description || null]
    );

    const newCollege = await query(
      'SELECT * FROM colleges WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(
      { message: 'College created successfully', college: newCollege[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json(
      { error: 'Failed to create college' },
      { status: 500 }
    );
  }
}