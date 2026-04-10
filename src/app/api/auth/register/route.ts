// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, phone } = body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create user
    const result = await registerUser({
      email,
      password,
      first_name,
      last_name,
      phone: phone || null,
      role: 'lecturer',
    });

    if (!result.success || !result.user || !result.sessionId) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed' },
        { status: 400 }
      );
    }

    // Build response with cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Registration successful. Logged in automatically.',
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
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}