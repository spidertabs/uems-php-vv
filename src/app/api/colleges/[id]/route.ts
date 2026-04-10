/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/colleges/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper to safely parse ID
function parseId(id: string | undefined): number | null {
  if (!id) return null;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

// GET single college with its departments
export async function GET(request: NextRequest) {
  try {
    // Extract ID directly from URL
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const rawId = parts[parts.length - 1];
    const collegeId = Number(rawId);

    console.log('Raw ID from URL:', rawId);
    console.log('Parsed college ID:', collegeId);

    if (!collegeId || Number.isNaN(collegeId)) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    // Fetch college
    const colleges = await query(
      'SELECT * FROM colleges WHERE id = ?',
      [collegeId]
    );

    if (!colleges || colleges.length === 0) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Fetch departments
    const departments = await query(
      'SELECT * FROM departments WHERE college_id = ? ORDER BY name',
      [collegeId]
    );

    return NextResponse.json({
      college: colleges[0],
      departments: departments || [],
    });
  } catch (error: any) {
    console.error('Error fetching college:', error);
    return NextResponse.json(
      { error: 'Failed to fetch college', details: error.message },
      { status: 500 }
    );
  }
}


// PUT - Update college
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collegeId = parseId(params.id);
    if (collegeId === null) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check if college exists
    const existing = await query('SELECT id FROM colleges WHERE id = ?', [
      collegeId,
    ]);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check for duplicates excluding current college
    const duplicates = await query(
      `SELECT id FROM colleges 
       WHERE (code = ? OR name = ?) AND id != ?`,
      [code, name, collegeId]
    );

    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: 'College with this code or name already exists' },
        { status: 409 }
      );
    }

    // Update college
    await query(
      `UPDATE colleges 
       SET code = ?, name = ?, description = ?
       WHERE id = ?`,
      [code, name, description ?? null, collegeId]
    );

    const updated = await query('SELECT * FROM colleges WHERE id = ?', [
      collegeId,
    ]);

    return NextResponse.json({
      message: 'College updated successfully',
      college: updated[0],
    });
  } catch (error: any) {
    console.error('Error updating college:', error);
    return NextResponse.json(
      { error: 'Failed to update college', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete college
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collegeId = parseId(params.id);
    if (collegeId === null) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    // Check if college exists
    const existing = await query('SELECT id FROM colleges WHERE id = ?', [
      collegeId,
    ]);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check for associated departments
    const departments = await query(
      'SELECT COUNT(*) as count FROM departments WHERE college_id = ?',
      [collegeId]
    );

    if (departments[0].count > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete college with existing departments. Please delete departments first.',
          departments_count: departments[0].count,
        },
        { status: 409 }
      );
    }

    // Delete college
    await query('DELETE FROM colleges WHERE id = ?', [collegeId]);

    return NextResponse.json({
      message: 'College deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting college:', error);
    return NextResponse.json(
      { error: 'Failed to delete college', details: error.message },
      { status: 500 }
    );
  }
}
