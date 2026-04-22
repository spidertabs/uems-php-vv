/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/candidates.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Database query functions for phd_candidates
// ─────────────────────────────────────────────────────────────────────────────
import { query } from '@/lib/db';
import type { PhdCandidate, CandidateWithDetails, CandidateStatus } from '@/types/phd';

interface CandidateFilters {
  status?: string;
  programme_id?: number;
  supervisor_id?: number;
  search?: string;
}

export async function getAllCandidates(filters?: CandidateFilters): Promise<CandidateWithDetails[]> {
  let sql = `
    SELECT
      pc.id, pc.user_id, pc.registration_number,
      pc.thesis_title, pc.programme_id, pc.supervisor_id,
      pc.co_supervisor_id, pc.status, pc.enrolment_year,
      pc.deleted_at, pc.deleted_by, pc.created_at, pc.updated_at,
      CONCAT(u.first_name, ' ', u.last_name) AS candidate_name,
      u.email AS candidate_email,
      p.name AS programme_name,
      p.code AS programme_code,
      CONCAT(s.first_name, ' ', s.last_name) AS supervisor_name,
      s.email AS supervisor_email,
      cs.first_name AS co_sup_first,
      cs.last_name AS co_sup_last,
      (SELECT COUNT(*) FROM thesis_submissions ts WHERE ts.candidate_id = pc.id) AS thesis_count,
      (SELECT COUNT(*) FROM viva_schedules vs WHERE vs.candidate_id = pc.id) AS viva_count
    FROM phd_candidates pc
    JOIN users u ON pc.user_id = u.id
    JOIN programmes p ON pc.programme_id = p.id
    LEFT JOIN users s ON pc.supervisor_id = s.id
    LEFT JOIN users cs ON pc.co_supervisor_id = cs.id
    WHERE pc.deleted_at IS NULL
  `;
  const params: (string | number)[] = [];

  if (filters?.status) {
    sql += ' AND pc.status = ?';
    params.push(filters.status);
  }
  if (filters?.programme_id) {
    sql += ' AND pc.programme_id = ?';
    params.push(filters.programme_id);
  }
  if (filters?.supervisor_id) {
    sql += ' AND pc.supervisor_id = ?';
    params.push(filters.supervisor_id);
  }
  if (filters?.search) {
    sql += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR pc.registration_number LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY pc.created_at DESC';
  const rows = await query<any[]>(sql, params);
  return rows.map(mapCandidate);
}

export async function getCandidateById(id: number): Promise<CandidateWithDetails | null> {
  const rows = await query<any[]>(`
    SELECT
      pc.id, pc.user_id, pc.registration_number,
      pc.thesis_title, pc.programme_id, pc.supervisor_id,
      pc.co_supervisor_id, pc.status, pc.enrolment_year,
      pc.deleted_at, pc.deleted_by, pc.created_at, pc.updated_at,
      CONCAT(u.first_name, ' ', u.last_name) AS candidate_name,
      u.email AS candidate_email,
      p.name AS programme_name,
      p.code AS programme_code,
      CONCAT(s.first_name, ' ', s.last_name) AS supervisor_name,
      s.email AS supervisor_email,
      cs.first_name AS co_sup_first,
      cs.last_name AS co_sup_last,
      (SELECT COUNT(*) FROM thesis_submissions ts WHERE ts.candidate_id = pc.id) AS thesis_count,
      (SELECT COUNT(*) FROM viva_schedules vs WHERE vs.candidate_id = pc.id) AS viva_count
    FROM phd_candidates pc
    JOIN users u ON pc.user_id = u.id
    JOIN programmes p ON pc.programme_id = p.id
    LEFT JOIN users s ON pc.supervisor_id = s.id
    LEFT JOIN users cs ON pc.co_supervisor_id = cs.id
    WHERE pc.id = ? AND pc.deleted_at IS NULL
    LIMIT 1
  `, [id]);
  return rows.length > 0 ? mapCandidate(rows[0]) : null;
}

export async function getCandidateByUserId(userId: number): Promise<PhdCandidate | null> {
  const rows = await query<PhdCandidate[]>(
    'SELECT * FROM phd_candidates WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createCandidate(data: {
  user_id: number;
  registration_number: string;
  thesis_title: string;
  programme_id: number;
  supervisor_id: number;
  co_supervisor_id?: number | null;
  enrolment_year: number;
}): Promise<number> {
  const result = await query<any>(
    `INSERT INTO phd_candidates
     (user_id, registration_number, thesis_title, programme_id, supervisor_id,
      co_supervisor_id, status, enrolment_year, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'enrolled', ?, NOW(), NOW())`,
    [
      data.user_id, data.registration_number, data.thesis_title,
      data.programme_id, data.supervisor_id,
      data.co_supervisor_id ?? null, data.enrolment_year,
    ]
  );
  return result.insertId;
}

export async function updateCandidate(
  id: number,
  data: Partial<Pick<PhdCandidate, 'thesis_title' | 'co_supervisor_id' | 'status' | 'enrolment_year' | 'supervisor_id'>>
): Promise<void> {
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await query(`UPDATE phd_candidates SET ${fields}, updated_at = NOW() WHERE id = ?`, values);
}

export async function updateCandidateStatus(id: number, status: CandidateStatus): Promise<void> {
  await query(
    'UPDATE phd_candidates SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id]
  );
}

export async function getEligibleSupervisors(deptId?: number): Promise<any[]> {
  let sql = `
    SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.role,
           d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN phd_candidates pc ON u.id = pc.user_id
    WHERE u.role NOT IN ('hod', 'exam_master') 
      AND u.is_active = TRUE 
      AND pc.id IS NULL
      AND u.deleted_at IS NULL
  `;
  const params: number[] = [];
  if (deptId) {
    sql += ' AND u.department_id = ?';
    params.push(deptId);
  }
  sql += ' ORDER BY u.first_name, u.last_name';
  return query<any[]>(sql, params);
}

export async function getUsersForCandidateRegistration(): Promise<any[]> {
  return query<any[]>(
    `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.role
     FROM users u
     LEFT JOIN phd_candidates pc ON u.id = pc.user_id
     WHERE pc.id IS NULL 
       AND u.is_active = TRUE 
       AND u.deleted_at IS NULL
     ORDER BY u.first_name, u.last_name`,
    []
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function mapCandidate(row: any): CandidateWithDetails {
  return {
    ...row,
    co_supervisor_name:
      row.co_sup_first && row.co_sup_last
        ? `${row.co_sup_first} ${row.co_sup_last}`
        : null,
    thesis_count: Number(row.thesis_count ?? 0),
    viva_count: Number(row.viva_count ?? 0),
  };
}
