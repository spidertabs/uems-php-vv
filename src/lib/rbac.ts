// src/lib/rbac.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserPayload } from './auth';
import { query } from './db';

// =====================================================
// ROLE DEFINITIONS
// =====================================================

export const ROLES = {
  ADMIN: 'admin',
  EXAM_MASTER: 'exam_master',
  DEAN: 'dean',
  HOD: 'hod',
  LECTURER: 'lecturer',
} as const;

export type UserRole = 'admin' | 'exam_master' | 'dean' | 'hod' | 'lecturer';

// =====================================================
// PERMISSIONS BY ROLE
// =====================================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    // User Management
    'manage_users',
    'create_users',
    'edit_users',
    'delete_users',
    'view_all_users',
    'import_users',
    
    // Organization Management
    'manage_colleges',
    'create_colleges',
    'edit_colleges',
    'delete_colleges',
    'manage_departments',
    'create_departments',
    'edit_departments',
    'delete_departments',
    'manage_programmes',
    'create_programmes',
    'edit_programmes',
    'delete_programmes',
    'import_programmes',
    
    // Course Management
    'manage_courses',
    'create_courses',
    'edit_courses',
    'delete_courses',
    'import_courses',
    'manage_study_units',
    
    // Permissions Management
    'manage_permissions',
    'grant_permissions',
    'revoke_permissions',
    
    // Question Bank
    'create_questions',
    'edit_all_questions',
    'delete_questions',
    'approve_questions',
    'view_all_questions',
    
    // Exam Papers
    'view_all_papers',
    'edit_all_papers',
    'delete_papers',
    'approve_papers',
    'publish_papers',
    
    // Workflow & Approvals
    'approve_as_hod',
    'approve_as_dean',
    'manage_workflow',
    
    // Printing
    'manage_printing',
    'view_print_queue',
    'start_printing',
    'complete_printing',
    
    // Reports & Analytics
    'view_all_reports',
    'export_reports',
    'view_analytics',
    
    // Audit & System
    'view_audit_logs',
    'manage_system',
    'system_settings',
  ],
  
  exam_master: [
    // Exam Papers (Read-only for approved papers)
    'view_all_papers',
    'view_approved_papers',
    
    // Printing Management
    'manage_printing',
    'view_print_queue',
    'start_printing',
    'complete_printing',
    'view_print_history',
    
    // Publishing
    'publish_papers',
    'manage_exam_schedules',
    
    // Reports
    'view_print_reports',
    'view_exam_reports',
    
    // Notifications
    'view_notifications',
  ],
  
  dean: [
    // View College Data
    'view_college_papers',
    'view_college_courses',
    'view_college_departments',
    
    // Approvals
    'approve_papers',
    'approve_as_dean',
    'view_pending_approvals',
    
    // Reports
    'view_reports',
    'view_college_reports',
    'export_reports',
    
    // Audit
    'view_audit_logs',
    
    // Notifications
    'view_notifications',
  ],
  
  hod: [
    // Organization Management
    'manage_departments',
    'view_department',
    'edit_department',
    
    // Course Management
    'manage_department_courses',
    'create_courses',
    'edit_courses',
    'import_courses',
    
    // Study Units
    'create_study_units',
    'edit_study_units',
    'delete_study_units',
    'manage_study_units',
    
    // Question Bank
    'create_questions',
    'edit_own_questions',
    'approve_questions',
    'view_department_questions',
    
    // Permissions Management
    'grant_lecturer_permissions',
    'revoke_lecturer_permissions',
    'view_permissions',
    'manage_permissions',
    
    // Exam Papers
    'view_department_papers',
    'approve_papers',
    'approve_as_hod',
    'view_pending_approvals',
    
    // Reports
    'view_reports',
    'view_department_reports',
    'export_reports',
    
    // Audit
    'view_audit_logs',
    
    // Colleges & Programmes (View only)
    'view_colleges',
    'view_programmes',
    
    // Notifications
    'view_notifications',
  ],
  
  lecturer: [
    // Question Bank
    'create_questions',
    'edit_own_questions',
    'view_own_questions',
    'view_permitted_questions',
    
    // Exam Papers
    'create_papers',
    'edit_own_papers',
    'view_own_papers',
    'submit_papers',
    
    // Notifications
    'view_notifications',
    'view_feedback',
    
    // Profile
    'view_own_profile',
    'edit_own_profile',
  ],
};

// =====================================================
// PERMISSION CHECKER FUNCTIONS
// =====================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: UserPayload | null, permission: string): boolean {
  if (!user) return false;

  const userRole = user.role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: UserPayload | null, permissions: string[]): boolean {
  if (!user) return false;

  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(user: UserPayload | null, permissions: string[]): boolean {
  if (!user) return false;

  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if user is in one of the specified roles
 */
export function hasRole(user: UserPayload | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as UserRole);
}

// =====================================================
// RESOURCE ACCESS CONTROL
// =====================================================

/**
 * Check if user can access a specific college
 */
export async function canAccessCollege(userId: number, collegeId: number): Promise<boolean> {
  try {
    const users = await query<any[]>(
      `SELECT role, college_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) return false;
    const user = users[0];
    const userRole = user.role as UserRole;

    // Admin can access everything
    if (userRole === 'admin') return true;

    // Dean can access their college
    if (userRole === 'dean') {
      return user.college_id === collegeId;
    }

    // HOD can view colleges
    if (userRole === 'hod') {
      return true; // View only
    }

    return false;
  } catch (error) {
    console.error('Error checking college access:', error);
    return false;
  }
}

/**
 * Check if user can access a specific department
 */
export async function canAccessDepartment(userId: number, departmentId: number): Promise<boolean> {
  try {
    const users = await query<any[]>(
      `SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) return false;
    const user = users[0];
    const userRole = user.role as UserRole;

    // Admin can access everything
    if (userRole === 'admin') return true;

    // Get department's college
    const departments = await query<any[]>(
      `SELECT college_id FROM departments WHERE id = ? LIMIT 1`,
      [departmentId]
    );

    if (!departments || departments.length === 0) return false;
    const department = departments[0];

    // Dean can access departments in their college
    if (userRole === 'dean') {
      return user.college_id === department.college_id;
    }

    // HOD can access their department
    if (userRole === 'hod') {
      return user.department_id === departmentId;
    }

    return false;
  } catch (error) {
    console.error('Error checking department access:', error);
    return false;
  }
}

/**
 * Check if user can access a specific programme
 */
export async function canAccessProgramme(userId: number, programmeId: number): Promise<boolean> {
  try {
    const users = await query<any[]>(
      `SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) return false;
    const user = users[0];
    const userRole = user.role as UserRole;

    // Admin can access everything
    if (userRole === 'admin') return true;

    // Get programme details
    const programmes = await query<any[]>(
      `SELECT department_id, college_id FROM programmes WHERE id = ? LIMIT 1`,
      [programmeId]
    );

    if (!programmes || programmes.length === 0) return false;
    const programme = programmes[0];

    // Dean can access programmes in their college
    if (userRole === 'dean') {
      return user.college_id === programme.college_id;
    }

    // HOD can access programmes in their department
    if (userRole === 'hod') {
      return user.department_id === programme.department_id;
    }

    return false;
  } catch (error) {
    console.error('Error checking programme access:', error);
    return false;
  }
}

/**
 * Check if user can access a specific course
 */
export async function canAccessCourse(userId: number, courseId: number): Promise<boolean> {
  try {
    // Get user details
    const users = await query<any[]>(
      `SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) return false;
    const user = users[0];
    const userRole = user.role as UserRole;

    // Admin can access everything
    if (userRole === 'admin') return true;

    // Get course details
    const courses = await query<any[]>(
      `SELECT department_id, college_id FROM courses WHERE id = ? LIMIT 1`,
      [courseId]
    );

    if (!courses || courses.length === 0) return false;
    const course = courses[0];

    // Check based on role
    switch (userRole) {
      case 'exam_master':
        return true; // Exam master can access all courses

      case 'dean':
        return user.college_id === course.college_id;

      case 'hod':
        return user.department_id === course.department_id;

      case 'lecturer':
        // Check if lecturer has permission for this course
        const permissions = await query<any[]>(
          `SELECT id FROM lecturer_permissions 
           WHERE lecturer_id = ? AND course_id = ? AND is_active = TRUE
           LIMIT 1`,
          [userId, courseId]
        );
        return permissions && permissions.length > 0;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking course access:', error);
    return false;
  }
}

// =====================================================
// EXAM PAPER ACCESS CONTROL
// =====================================================

/**
 * Check if user can view a specific exam paper
 */
export async function canViewPaper(userId: number, paperId: number): Promise<boolean> {
  try {
    const [users, papers] = await Promise.all([
      query<any[]>(`SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`, [
        userId,
      ]),
      query<any[]>(
        `SELECT ep.*, c.department_id, c.college_id 
         FROM exam_papers ep
         JOIN courses c ON ep.course_id = c.id
         WHERE ep.id = ? LIMIT 1`,
        [paperId]
      ),
    ]);

    if (!users || users.length === 0 || !papers || papers.length === 0) {
      return false;
    }

    const user = users[0];
    const paper = papers[0];
    const userRole = user.role as UserRole;

    switch (userRole) {
      case 'admin':
      case 'exam_master':
        return true;

      case 'dean':
        return user.college_id === paper.college_id;

      case 'hod':
        return user.department_id === paper.department_id;

      case 'lecturer':
        return paper.created_by === userId;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking paper view access:', error);
    return false;
  }
}

/**
 * Check if user can approve papers
 */
export async function canApprovePaper(userId: number, paperId: number): Promise<boolean> {
  try {
    // Get user and paper details
    const [users, papers] = await Promise.all([
      query<any[]>(`SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`, [
        userId,
      ]),
      query<any[]>(
        `SELECT ep.*, c.department_id, c.college_id 
         FROM exam_papers ep
         JOIN courses c ON ep.course_id = c.id
         WHERE ep.id = ? LIMIT 1`,
        [paperId]
      ),
    ]);

    if (!users || users.length === 0 || !papers || papers.length === 0) {
      return false;
    }

    const user = users[0];
    const paper = papers[0];
    const userRole = user.role as UserRole;

    // Check based on role and paper status
    switch (userRole) {
      case 'hod':
        return (
          user.department_id === paper.department_id &&
          ['submitted', 'hod_review'].includes(paper.status)
        );

      case 'dean':
        return (
          user.college_id === paper.college_id &&
          ['hod_approved', 'dean_review'].includes(paper.status)
        );

      case 'admin':
        return true;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking paper approval access:', error);
    return false;
  }
}

/**
 * Check if user can edit exam paper
 */
export async function canEditPaper(userId: number, paperId: number): Promise<boolean> {
  try {
    const papers = await query<any[]>(
      `SELECT created_by, status FROM exam_papers WHERE id = ? LIMIT 1`,
      [paperId]
    );

    if (!papers || papers.length === 0) return false;
    const paper = papers[0];

    // Can only edit if user created it and it's still in draft or rejected
    return (
      paper.created_by === userId && 
      ['draft', 'hod_rejected', 'dean_rejected'].includes(paper.status)
    );
  } catch (error) {
    console.error('Error checking paper edit access:', error);
    return false;
  }
}

/**
 * Check if user can print paper
 */
export async function canPrintPaper(userId: number, paperId: number): Promise<boolean> {
  try {
    const [users, papers] = await Promise.all([
      query<any[]>(`SELECT role FROM users WHERE id = ? LIMIT 1`, [userId]),
      query<any[]>(`SELECT status FROM exam_papers WHERE id = ? LIMIT 1`, [paperId]),
    ]);

    if (!users || users.length === 0 || !papers || papers.length === 0) {
      return false;
    }

    const user = users[0];
    const paper = papers[0];
    const userRole = user.role as UserRole;

    // Only exam_master and admin can print
    // Paper must be in ready_for_print status
    return (
      (userRole === 'exam_master' || userRole === 'admin') &&
      ['ready_for_print', 'printing'].includes(paper.status)
    );
  } catch (error) {
    console.error('Error checking paper print access:', error);
    return false;
  }
}

// =====================================================
// QUESTION BANK ACCESS CONTROL
// =====================================================

/**
 * Check if lecturer has permission to add questions to a course
 */
export async function hasQuestionPermission(
  lecturerId: number,
  courseId: number
): Promise<boolean> {
  try {
    // Check if lecturer or higher role
    const users = await query<any[]>(`SELECT role FROM users WHERE id = ? LIMIT 1`, [lecturerId]);

    if (!users || users.length === 0) return false;
    const user = users[0];
    const userRole = user.role as UserRole;

    // HOD, Dean, Admin can add questions to any course in their scope
    if (userRole === 'hod' || userRole === 'dean' || userRole === 'admin') {
      return await canAccessCourse(lecturerId, courseId);
    }

    // Lecturers need explicit permission
    const permissions = await query<any[]>(
      `SELECT id FROM lecturer_permissions 
       WHERE lecturer_id = ? AND course_id = ? 
       AND can_add_questions = TRUE 
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [lecturerId, courseId]
    );

    return permissions && permissions.length > 0;
  } catch (error) {
    console.error('Error checking question permission:', error);
    return false;
  }
}

/**
 * Check if user can edit a specific question
 */
export async function canEditQuestion(userId: number, questionId: number): Promise<boolean> {
  try {
    const [users, questions] = await Promise.all([
      query<any[]>(`SELECT role FROM users WHERE id = ? LIMIT 1`, [userId]),
      query<any[]>(`SELECT created_by, course_id FROM questions WHERE id = ? LIMIT 1`, [
        questionId,
      ]),
    ]);

    if (!users || users.length === 0 || !questions || questions.length === 0) {
      return false;
    }

    const user = users[0];
    const question = questions[0];
    const userRole = user.role as UserRole;

    // Admin can edit all
    if (userRole === 'admin') return true;

    // HOD can edit questions in their department courses
    if (userRole === 'hod') {
      return await canAccessCourse(userId, question.course_id);
    }

    // Lecturer can only edit their own questions
    return question.created_by === userId;
  } catch (error) {
    console.error('Error checking question edit access:', error);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get HOD for a department
 */
export async function getDepartmentHOD(departmentId: number): Promise<number | null> {
  try {
    const hods = await query<any[]>(
      `SELECT id FROM users 
       WHERE department_id = ? AND role = 'hod' AND is_active = TRUE
       LIMIT 1`,
      [departmentId]
    );

    return hods && hods.length > 0 ? hods[0].id : null;
  } catch (error) {
    console.error('Error getting department HOD:', error);
    return null;
  }
}

/**
 * Get Dean for a college
 */
export async function getCollegeDean(collegeId: number): Promise<number | null> {
  try {
    const deans = await query<any[]>(
      `SELECT id FROM users 
       WHERE college_id = ? AND role = 'dean' AND is_active = TRUE
       LIMIT 1`,
      [collegeId]
    );

    return deans && deans.length > 0 ? deans[0].id : null;
  } catch (error) {
    console.error('Error getting college dean:', error);
    return null;
  }
}

/**
 * Get all users with a specific role in a department
 */
export async function getDepartmentUsersByRole(
  departmentId: number,
  role: UserRole
): Promise<number[]> {
  try {
    const users = await query<any[]>(
      `SELECT id FROM users 
       WHERE department_id = ? AND role = ? AND is_active = TRUE`,
      [departmentId, role]
    );

    return users ? users.map((u) => u.id) : [];
  } catch (error) {
    console.error('Error getting department users by role:', error);
    return [];
  }
}

/**
 * Check if user can manage other user
 */
export async function canManageUser(managerId: number, targetUserId: number): Promise<boolean> {
  try {
    const [managers, targets] = await Promise.all([
      query<any[]>(
        `SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`,
        [managerId]
      ),
      query<any[]>(
        `SELECT role, department_id, college_id FROM users WHERE id = ? LIMIT 1`,
        [targetUserId]
      ),
    ]);

    if (!managers || managers.length === 0 || !targets || targets.length === 0) {
      return false;
    }

    const manager = managers[0];
    const target = targets[0];
    const managerRole = manager.role as UserRole;
    const targetRole = target.role as UserRole;

    // Admin can manage everyone
    if (managerRole === 'admin') return true;

    // Can't manage users of equal or higher role
    const roleHierarchy: UserRole[] = ['lecturer', 'hod', 'dean', 'exam_master', 'admin'];
    const managerLevel = roleHierarchy.indexOf(managerRole);
    const targetLevel = roleHierarchy.indexOf(targetRole);

    if (targetLevel >= managerLevel) return false;

    // HOD can manage lecturers in their department
    if (managerRole === 'hod') {
      return (
        targetRole === 'lecturer' && 
        manager.department_id === target.department_id
      );
    }

    // Dean can manage HODs and lecturers in their college
    if (managerRole === 'dean') {
      return (
        (targetRole === 'hod' || targetRole === 'lecturer') &&
        manager.college_id === target.college_id
      );
    }

    return false;
  } catch (error) {
    console.error('Error checking user management access:', error);
    return false;
  }
}