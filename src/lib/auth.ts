/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/auth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { query } from './db';
import type { User, Session } from '@/types';

export interface UserPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'lecturer' | 'hod' | 'dean' | 'exam_master' | 'admin';
  department_id: number | null;
  college_id: number | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create session
export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (session_id, user_id, expires_at) 
     VALUES (?, ?, ?)`,
    [sessionId, userId, expiresAt]
  );

  return sessionId;
}

// Get user from session
export async function getUserFromSession(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) return null;

    const rows = await query<User[]>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
              u.department_id, u.college_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_id = ? AND s.expires_at > NOW() AND u.is_active = 1
       LIMIT 1`,
      [sessionId]
    );

    const result = Array.isArray(rows) ? rows[0] : null;

    if (!result) return null;

    return {
      id: result.id,
      email: result.email,
      first_name: result.first_name,
      last_name: result.last_name,
      role: result.role,
      department_id: result.department_id,
      college_id: result.college_id,
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

// Delete session
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      await query('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
    }
  } catch (error) {
    console.error('Delete session error:', error);
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserPayload; sessionId?: string; error?: string }> {
  try {
    console.log('🔍 Login attempt for email:', email);

    const rows = await query<User[]>(
      `SELECT id, email, password_hash, first_name, last_name, role, 
              department_id, college_id, is_active 
       FROM users 
       WHERE email = ? LIMIT 1`,
      [email]
    );

    const users = Array.isArray(rows) ? rows : [];
    console.log('📊 Users found:', users.length);

    if (users.length === 0) {
      return { success: false, error: 'Invalid email or password' };
    }

    const user = users[0];

    if (!user.is_active) {
      return { success: false, error: 'Account is inactive' };
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department_id: user.department_id,
      college_id: user.college_id,
    };

    const sessionId = await createSession(user.id);
    return { success: true, user: payload, sessionId };
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Register user
export async function registerUser(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
  department_id?: number;
  phone?: string;
}): Promise<{ success: boolean; user?: UserPayload; sessionId?: string; error?: string }> {
  try {
    const existing = await query<User[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [
      data.email,
    ]);

    const exists = Array.isArray(existing) && existing.length > 0;

    if (exists) {
      return { success: false, error: 'Email already registered' };
    }

    const passwordHash = await hashPassword(data.password);

    const result = await query<any>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, department_id, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.email,
        passwordHash,
        data.first_name,
        data.last_name,
        data.role || 'lecturer',
        data.department_id || null,
        data.phone || null,
      ]
    );

    const payload: UserPayload = {
      id: result.insertId,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: (data.role as any) || 'lecturer',
      department_id: data.department_id || null,
      college_id: null,
    };

    const sessionId = await createSession(result.insertId);

    return { success: true, user: payload, sessionId };
  } catch (error) {
    console.error('❌ Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

export function hasRole(user: UserPayload | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// Verify authentication from NextRequest (for API routes)
export async function verifyAuth(request: NextRequest): Promise<UserPayload | null> {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return null;
    }

    const rows = await query<User[]>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
              u.department_id, u.college_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_id = ? AND s.expires_at > NOW() AND u.is_active = 1
       LIMIT 1`,
      [sessionId]
    );

    const result = Array.isArray(rows) ? rows[0] : null;

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      email: result.email,
      first_name: result.first_name,
      last_name: result.last_name,
      role: result.role,
      department_id: result.department_id,
      college_id: result.college_id,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Verify authentication and check roles
export async function verifyAuthWithRoles(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ user: UserPayload | null; hasAccess: boolean }> {
  const user = await verifyAuth(request);
  
  if (!user) {
    return { user: null, hasAccess: false };
  }

  const hasAccess = allowedRoles.includes(user.role);
  return { user, hasAccess };
}