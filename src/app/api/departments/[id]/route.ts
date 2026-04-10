// src/app/api/departments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET single department
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deptId = params.id;

    const departments = await query(
      `SELECT 
        d.*,
        c.name as college_name
       FROM departments d
       LEFT JOIN colleges c ON d.college_id = c.id
       WHERE d.id = ?`,
      [deptId]
    );

    if (departments.length === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      department: departments[0],
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// PUT - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deptId = params.id;
    const body = await request.json();
    const { code, name, description } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check if department exists
    const existing = await query(
      'SELECT id FROM departments WHERE id = ?',
      [deptId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check for duplicates (excluding current department)
    const duplicates = await query(
      `SELECT id FROM departments 
       WHERE (code = ? OR name = ?) 
       AND id != ?`,
      [code, name, deptId]
    );

    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: 'Department with this code or name already exists' },
        { status: 409 }
      );
    }

    // Update department
    await query(
      `UPDATE departments 
       SET code = ?, name = ?, description = ?
       WHERE id = ?`,
      [code, name, description || null, deptId]
    );

    const updated = await query(
      `SELECT d.*, c.name as college_name
       FROM departments d
       LEFT JOIN colleges c ON d.college_id = c.id
       WHERE d.id = ?`,
      [deptId]
    );

    return NextResponse.json({
      message: 'Department updated successfully',
      department: updated[0],
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deptId = params.id;

    // Check if department exists
    const existing = await query(
      'SELECT id FROM departments WHERE id = ?',
      [deptId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check for associated courses
    const courses = await query(
      'SELECT COUNT(*) as count FROM courses WHERE department_id = ?',
      [deptId]
    );

    if (courses[0].count > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete department with existing courses. Please delete or reassign courses first.',
          courses_count: courses[0].count 
        },
        { status: 409 }
      );
    }

    // Check for associated programmes
    const programmes = await query(
      'SELECT COUNT(*) as count FROM programmes WHERE department_id = ?',
      [deptId]
    );

    if (programmes[0].count > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete department with existing programmes. Please delete or reassign programmes first.',
          programmes_count: programmes[0].count 
        },
        { status: 409 }
      );
    }

    // Delete department
    await query('DELETE FROM departments WHERE id = ?', [deptId]);

    return NextResponse.json({
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}