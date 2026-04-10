// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAuditFromRequest, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';

export async function GET() {
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch additional user details including department and college names
    const userDetails = await query(
      `SELECT 
        u.*,
        d.name as department_name,
        c.name as college_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id = ?`,
      [user.id]
    );

    if (userDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDetails[0];

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        phone: userData.phone,
        department_id: userData.department_id,
        department_name: userData.department_name,
        college_id: userData.college_id,
        college_name: userData.college_name,
        is_active: userData.is_active,
        last_login: userData.last_login,
        created_at: userData.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, phone } = body;

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Validate name lengths
    if (first_name.length > 50 || last_name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Names must be less than 50 characters' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && phone.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be less than 20 characters' },
        { status: 400 }
      );
    }

    // Get old values before update
    const oldUserData = await query(
      'SELECT first_name, last_name, phone FROM users WHERE id = ?',
      [user.id]
    );
    const oldUser = Array.isArray(oldUserData) && oldUserData.length > 0 
      ? oldUserData[0] 
      : null;

    // Update user profile
    await query(
      `UPDATE users 
       SET first_name = ?, 
           last_name = ?, 
           phone = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [first_name, last_name, phone || null, user.id]
    );

    // Log the profile update with old and new values
    await logAuditFromRequest(request, {
      userId: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user.id,
      oldValues: {
        first_name: oldUser?.first_name,
        last_name: oldUser?.last_name,
        phone: oldUser?.phone,
      },
      newValues: {
        first_name,
        last_name,
        phone,
      },
    });

    // Fetch updated user details
    const updatedUser = await query(
      `SELECT 
        u.*,
        d.name as department_name,
        c.name as college_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id = ?`,
      [user.id]
    );

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = updatedUser[0];

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        phone: userData.phone,
        department_id: userData.department_id,
        department_name: userData.department_name,
        college_id: userData.college_id,
        college_name: userData.college_name,
        is_active: userData.is_active,
        last_login: userData.last_login,
        created_at: userData.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}