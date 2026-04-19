// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession, verifyPassword, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { logAuditFromRequest, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    // Validate required fields
    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (new_password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Get current password hash from database
    const userRows = await query(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    );

    if (!Array.isArray(userRows) || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userRows[0];

    // Verify current password
    const isValidPassword = await verifyPassword(current_password, userData.password_hash);

    if (!isValidPassword) {
      // Log failed password change attempt
      await logAuditFromRequest(request, {
        userId: user.id,
        action: 'password_change_failed',
        entityType: AUDIT_ENTITIES.USER,
        entityId: user.id,
        newValues: {
          reason: 'Current password is incorrect',
          attempted_at: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(new_password);

    // Update password
    await query(
      `UPDATE users 
       SET password_hash = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [newPasswordHash, user.id]
    );

    // Log successful password change
    await logAuditFromRequest(request, {
      userId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user.id,
      newValues: {
        changed_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}