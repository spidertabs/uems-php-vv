/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/audit/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has permission to view audit logs
    if (!['admin', 'dean', 'hod'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Build WHERE clause
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (action && action !== 'all') {
      conditions.push('al.action = ?');
      params.push(action);
    }

    if (entityType && entityType !== 'all') {
      conditions.push('al.entity_type = ?');
      params.push(entityType);
    }

    if (userId && userId !== 'all') {
      conditions.push('al.user_id = ?');
      params.push(parseInt(userId));
    }

    if (dateFrom) {
      conditions.push('DATE(al.created_at) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('DATE(al.created_at) <= ?');
      params.push(dateTo);
    }

    if (search) {
      conditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR al.action LIKE ? OR al.entity_type LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Role-based filtering
    if (user.role === 'hod' && user.department_id) {
      conditions.push('(u.department_id = ? OR u.id = ?)');
      params.push(user.department_id, user.id);
    } else if (user.role === 'dean' && user.college_id) {
      conditions.push(`(
        EXISTS (
          SELECT 1 FROM departments d 
          WHERE d.id = u.department_id 
          AND d.college_id = ?
        ) OR u.id = ?
      )`);
      params.push(user.college_id, user.id);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0].total 
      : 0;

    // Get audit logs
    const logsQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at,
        CONCAT(COALESCE(u.first_name, 'Unknown'), ' ', COALESCE(u.last_name, 'User')) as user_name,
        COALESCE(u.email, 'deleted@user.com') as user_email,
        COALESCE(u.role, 'unknown') as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await query(logsQuery, [...params, limit, offset]);

    // Parse JSON fields
    const parsedLogs = Array.isArray(logs) ? logs.map(log => ({
      ...log,
      old_values: log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null,
      new_values: log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null,
    })) : [];

    return NextResponse.json({
      success: true,
      logs: parsedLogs,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('❌ Fetch audit logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}