// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { logAuditFromRequest, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    if (!result.success || !result.user || !result.sessionId) {
      // Optional: Log failed login attempts (useful for security monitoring)
      // Uncomment if you want to track failed logins
      /*
      if (result.user) {
        await logAuditFromRequest(request, {
          userId: result.user.id,
          action: 'login_failed',
          entityType: AUDIT_ENTITIES.USER,
          entityId: result.user.id,
          newValues: { 
            email: result.user.email,
            reason: result.error || 'Invalid credentials' 
          },
        });
      }
      */

      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log successful login
    await logAuditFromRequest(request, {
      userId: result.user.id,
      action: AUDIT_ACTIONS.LOGIN,
      entityType: AUDIT_ENTITIES.USER,
      entityId: result.user.id,
      newValues: {
        email: result.user.email,
        role: result.user.role,
        login_time: new Date().toISOString(),
      },
    });

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Login successful',
    });

    // Set session cookie
    response.cookies.set('session', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('❌ Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}