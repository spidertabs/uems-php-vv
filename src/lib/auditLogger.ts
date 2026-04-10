/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auditLogger.ts
import { query } from './db';
import { NextRequest } from 'next/server';

interface AuditLogData {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an audit event
 * @param data - The audit log data
 * @returns Promise<boolean> - Success status
 */
export async function logAudit(data: AuditLogData): Promise<boolean> {
  try {
    await query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.userId,
        data.action,
        data.entityType,
        data.entityId || null,
        data.oldValues ? JSON.stringify(data.oldValues) : null,
        data.newValues ? JSON.stringify(data.newValues) : null,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );
    return true;
  } catch (error) {
    console.error('❌ Audit log error:', error);
    return false;
  }
}

/**
 * Log an audit event from a Next.js request
 * @param request - The Next.js request object
 * @param data - The audit log data (without IP/user agent)
 * @returns Promise<boolean> - Success status
 */
export async function logAuditFromRequest(
  request: NextRequest,
  data: Omit<AuditLogData, 'ipAddress' | 'userAgent'>
): Promise<boolean> {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return logAudit({
    ...data,
    ipAddress,
    userAgent,
  });
}

/**
 * Common audit action types
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  
  // CRUD operations
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  
  // Workflow
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  RETURN: 'return',
  
  // Other actions
  PRINT: 'print',
  DOWNLOAD: 'download',
  EXPORT: 'export',
  IMPORT: 'import',
  GRANT: 'grant',
  REVOKE: 'revoke',
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  PUBLISH: 'publish',
} as const;

/**
 * Common entity types
 */
export const AUDIT_ENTITIES = {
  USER: 'user',
  PAPER: 'paper',
  QUESTION: 'question',
  COURSE: 'course',
  STUDY_UNIT: 'study_unit',
  PROGRAMME: 'programme',
  COLLEGE: 'college',
  DEPARTMENT: 'department',
  APPROVAL: 'approval',
  PERMISSION: 'permission',
  NOTIFICATION: 'notification',
  PRINT_JOB: 'print_job',
  WORKFLOW: 'workflow',
  SESSION: 'session',
} as const;

/**
 * Helper to extract changed fields between old and new values
 */
export function getChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): { old: Record<string, any>; new: Record<string, any> } {
  const changedOld: Record<string, any> = {};
  const changedNew: Record<string, any> = {};

  Object.keys(newValues).forEach((key) => {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedOld[key] = oldValues[key];
      changedNew[key] = newValues[key];
    }
  });

  return { old: changedOld, new: changedNew };
}

/**
 * Get audit logs for a specific entity
 * @param entityType - The entity type
 * @param entityId - The entity ID
 * @param limit - Maximum number of logs to return
 * @returns Promise<any[]> - Array of audit logs
 */
export async function getAuditLogsForEntity(
  entityType: string,
  entityId: number,
  limit: number = 50
): Promise<any[]> {
  try {
    const logs = await query(
      `SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ? AND al.entity_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?`,
      [entityType, entityId, limit]
    );
    return logs;
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get recent audit logs with optional filters
 * @param filters - Optional filters
 * @returns Promise<any[]> - Array of audit logs
 */
export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  try {
    let sql = `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.userId) {
      sql += ' AND al.user_id = ?';
      params.push(filters.userId);
    }

    if (filters?.action) {
      sql += ' AND al.action = ?';
      params.push(filters.action);
    }

    if (filters?.entityType) {
      sql += ' AND al.entity_type = ?';
      params.push(filters.entityType);
    }

    if (filters?.entityId) {
      sql += ' AND al.entity_id = ?';
      params.push(filters.entityId);
    }

    if (filters?.startDate) {
      sql += ' AND al.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      sql += ' AND al.created_at <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(filters?.limit || 100);

    const logs = await query(sql, params);
    return logs;
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get audit statistics
 * @param filters - Optional filters
 * @returns Promise<object> - Audit statistics
 */
export async function getAuditStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalLogs: number;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
  byUser: Array<{ user_id: number; name: string; count: number }>;
}> {
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters?.startDate) {
      whereClause += ' AND al.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      whereClause += ' AND al.created_at <= ?';
      params.push(filters.endDate);
    }

    // Total logs
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM audit_logs al ${whereClause}`,
      params
    );

    // By action
    const byActionResult = await query(
      `SELECT action, COUNT(*) as count 
       FROM audit_logs al ${whereClause}
       GROUP BY action 
       ORDER BY count DESC`,
      params
    );

    // By entity
    const byEntityResult = await query(
      `SELECT entity_type, COUNT(*) as count 
       FROM audit_logs al ${whereClause}
       GROUP BY entity_type 
       ORDER BY count DESC`,
      params
    );

    // By user
    const byUserResult = await query(
      `SELECT 
        al.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COUNT(*) as count
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       GROUP BY al.user_id, u.first_name, u.last_name
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    const byAction: Record<string, number> = {};
    byActionResult.forEach((row: any) => {
      byAction[row.action] = row.count;
    });

    const byEntity: Record<string, number> = {};
    byEntityResult.forEach((row: any) => {
      byEntity[row.entity_type] = row.count;
    });

    return {
      totalLogs: totalResult[0]?.count || 0,
      byAction,
      byEntity,
      byUser: byUserResult,
    };
  } catch (error) {
    console.error('❌ Error fetching audit stats:', error);
    return {
      totalLogs: 0,
      byAction: {},
      byEntity: {},
      byUser: [],
    };
  }
}

// ============================================
// EXAMPLE USAGE IN YOUR API ROUTES
// ============================================

/*
import { logAuditFromRequest, AUDIT_ACTIONS, AUDIT_ENTITIES, getChangedFields } from '@/lib/auditLogger';

// Example 1: Log CREATE action
export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  
  const newPaper = await createPaper(data);
  
  await logAuditFromRequest(request, {
    userId: user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITIES.PAPER,
    entityId: newPaper.id,
    newValues: {
      title: newPaper.title,
      course_id: newPaper.course_id,
      status: newPaper.status,
    },
  });
  
  return NextResponse.json({ success: true });
}

// Example 2: Log UPDATE action with old and new values
export async function PUT(request: NextRequest) {
  const user = await getUserFromSession();
  const { id, ...updates } = await request.json();
  
  // Get old values
  const oldPaper = await getPaperById(id);
  
  // Update
  const newPaper = await updatePaper(id, updates);
  
  // Log only changed fields
  const { old, new: newVals } = getChangedFields(
    {
      title: oldPaper.title,
      duration: oldPaper.duration,
      total_marks: oldPaper.total_marks,
    },
    {
      title: newPaper.title,
      duration: newPaper.duration,
      total_marks: newPaper.total_marks,
    }
  );
  
  await logAuditFromRequest(request, {
    userId: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITIES.PAPER,
    entityId: id,
    oldValues: old,
    newValues: newVals,
  });
  
  return NextResponse.json({ success: true });
}

// Example 3: Log DELETE action
export async function DELETE(request: NextRequest) {
  const user = await getUserFromSession();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // Get values before deletion
  const paper = await getPaperById(id);
  
  await deletePaper(id);
  
  await logAuditFromRequest(request, {
    userId: user.id,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITIES.PAPER,
    entityId: parseInt(id),
    oldValues: {
      title: paper.title,
      status: paper.status,
    },
  });
  
  return NextResponse.json({ success: true });
}

// Example 4: Log APPROVE action
export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  const { paper_id } = await request.json();
  
  const paper = await getPaperById(paper_id);
  
  await approvePaper(paper_id, user.id);
  
  await logAuditFromRequest(request, {
    userId: user.id,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: AUDIT_ENTITIES.PAPER,
    entityId: paper_id,
    oldValues: { status: paper.status },
    newValues: { status: 'approved', approved_by: user.id },
  });
  
  return NextResponse.json({ success: true });
}

// Example 5: Log LOGIN action
export async function POST(request: NextRequest) {
  const result = await loginUser(email, password);
  
  if (result.success && result.user) {
    await logAuditFromRequest(request, {
      userId: result.user.id,
      action: AUDIT_ACTIONS.LOGIN,
      entityType: AUDIT_ENTITIES.USER,
      entityId: result.user.id,
    });
  }
  
  return NextResponse.json(result);
}

// Example 6: Get audit logs for an entity
import { getAuditLogsForEntity, AUDIT_ENTITIES } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get('paper_id');
  
  const auditLogs = await getAuditLogsForEntity(
    AUDIT_ENTITIES.PAPER,
    parseInt(paperId!),
    50
  );
  
  return NextResponse.json({ success: true, logs: auditLogs });
}

// Example 7: Get audit logs with filters
import { getAuditLogs, AUDIT_ACTIONS } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  const logs = await getAuditLogs({
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'paper',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    limit: 100,
  });
  
  return NextResponse.json({ success: true, logs });
}

// Example 8: Get audit statistics
import { getAuditStats } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  const stats = await getAuditStats({
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
  });
  
  return NextResponse.json({ success: true, stats });
}
*/