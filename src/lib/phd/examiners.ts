/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/examiners.ts
import { query } from '@/lib/db';
import type { VivaExaminerWithUser, ExaminerRole } from '@/types/phd';

export async function getExaminersByVivaId(vivaId: number): Promise<VivaExaminerWithUser[]> {
  return query<VivaExaminerWithUser[]>(
    `SELECT
       ve.*,
       CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
       u.email AS examiner_email,
       u.role AS examiner_role_title
     FROM viva_examiners ve
     JOIN users u ON ve.examiner_id = u.id
     WHERE ve.viva_id = ?
     ORDER BY ve.id`,
    [vivaId]
  );
}

export async function assignExaminer(data: {
  viva_id: number;
  examiner_id: number;
  role: ExaminerRole;
}): Promise<number> {
  const result = await query<any>(
    `INSERT INTO viva_examiners (viva_id, examiner_id, role, confirmed)
     VALUES (?, ?, ?, FALSE)`,
    [data.viva_id, data.examiner_id, data.role]
  );
  return result.insertId;
}

export async function confirmExaminer(vivaId: number, examinerId: number): Promise<void> {
  await query(
    'UPDATE viva_examiners SET confirmed = TRUE, confirmed_at = NOW() WHERE viva_id = ? AND examiner_id = ?',
    [vivaId, examinerId]
  );
}

export async function removeExaminer(vivaId: number, examinerId: number): Promise<void> {
  await query(
    'DELETE FROM viva_examiners WHERE viva_id = ? AND examiner_id = ?',
    [vivaId, examinerId]
  );
}

export async function getEligibleExaminers(deptId?: number): Promise<any[]> {
  let sql = `
    SELECT u.id, u.first_name, u.last_name, u.email, u.role,
           d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role IN ('hod', 'lecturer', 'dean', 'admin') AND u.is_active = TRUE
  `;
  const params: number[] = [];
  if (deptId) {
    sql += ' AND u.department_id = ?';
    params.push(deptId);
  }
  sql += ' ORDER BY u.first_name, u.last_name';
  return query<any[]>(sql, params);
}

export async function isAssignedExaminer(vivaId: number, userId: number): Promise<boolean> {
  const rows = await query<any[]>(
    'SELECT id FROM viva_examiners WHERE viva_id = ? AND examiner_id = ? LIMIT 1',
    [vivaId, userId]
  );
  return rows.length > 0;
}
