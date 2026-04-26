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
      pc.id, pc.registration_number,
      pc.thesis_title, pc.programme_id, pc.supervisor_id,
      pc.co_supervisor_id, pc.status, pc.enrolment_year,
      pc.deleted_at, pc.deleted_by, pc.created_at, pc.updated_at,
      CONCAT(s.first_name, ' ', s.last_name) AS candidate_name,
      s.email AS candidate_email,
      p.name AS programme_name,
      p.code AS programme_code,
      CONCAT(sup.first_name, ' ', sup.last_name) AS supervisor_name,
      sup.email AS supervisor_email,
      cs.first_name AS co_sup_first,
      cs.last_name AS co_sup_last,
      (SELECT COUNT(*) FROM thesis_submissions ts WHERE ts.candidate_id = pc.id) AS thesis_count,
      (SELECT COUNT(*) FROM viva_schedules vs WHERE vs.candidate_id = pc.id) AS viva_count
    FROM phd_candidates pc
    LEFT JOIN students s ON pc.registration_number = s.registration_number
    JOIN programmes p ON pc.programme_id = p.id
    LEFT JOIN staff sup ON pc.supervisor_id = sup.id
    LEFT JOIN staff cs ON pc.co_supervisor_id = cs.id
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
    sql += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR pc.registration_number LIKE ?)';
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
      pc.id, pc.registration_number,
      pc.thesis_title, pc.programme_id, pc.supervisor_id,
      pc.co_supervisor_id, pc.status, pc.enrolment_year,
      pc.deleted_at, pc.deleted_by, pc.created_at, pc.updated_at,
      CONCAT(s.first_name, ' ', s.last_name) AS candidate_name,
      s.email AS candidate_email,
      p.name AS programme_name,
      p.code AS programme_code,
      CONCAT(sup.first_name, ' ', sup.last_name) AS supervisor_name,
      sup.email AS supervisor_email,
      cs.first_name AS co_sup_first,
      cs.last_name AS co_sup_last,
      (SELECT COUNT(*) FROM thesis_submissions ts WHERE ts.candidate_id = pc.id) AS thesis_count,
      (SELECT COUNT(*) FROM viva_schedules vs WHERE vs.candidate_id = pc.id) AS viva_count
    FROM phd_candidates pc
    LEFT JOIN students s ON pc.registration_number = s.registration_number
    JOIN programmes p ON pc.programme_id = p.id
    LEFT JOIN staff sup ON pc.supervisor_id = sup.id
    LEFT JOIN staff cs ON pc.co_supervisor_id = cs.id
    WHERE pc.id = ? AND pc.deleted_at IS NULL
    LIMIT 1
  `, [id]);
  return rows.length > 0 ? mapCandidate(rows[0]) : null;
}

export async function getCandidateByRegNo(regNo: string): Promise<PhdCandidate | null> {
  const rows = await query<PhdCandidate[]>(
    'SELECT * FROM phd_candidates WHERE registration_number = ? AND deleted_at IS NULL LIMIT 1',
    [regNo]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createCandidate(data: {
  registration_number: string;
  thesis_title: string;
  programme_id: number;
  supervisor_id: number;
  co_supervisor_id?: number | null;
  enrolment_year: number;
}): Promise<number> {
  const result = await query<any>(
    `INSERT INTO phd_candidates
     (registration_number, thesis_title, programme_id, supervisor_id,
      co_supervisor_id, status, enrolment_year, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'enrolled', ?, NOW(), NOW())`,
    [
      data.registration_number, data.thesis_title,
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
    FROM staff u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role NOT IN ('exam_master') 
      AND u.is_active = TRUE 
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

export async function getStudentsForCandidateRegistration(deptId?: number): Promise<any[]> {
  let sql = `
    SELECT DISTINCT s.registration_number, s.first_name, s.last_name, s.email
    FROM students s
    JOIN programmes p ON s.programme_id = p.id
    LEFT JOIN phd_candidates pc ON s.registration_number = pc.registration_number
    WHERE pc.id IS NULL 
      AND p.level = 'phd'
      AND s.is_active = TRUE 
      AND s.deleted_at IS NULL
  `;
  const params: any[] = [];
  
  if (deptId) {
    sql += ' AND p.department_id = ?';
    params.push(deptId);
  }
  
  sql += ' ORDER BY s.first_name, s.last_name';
  return query<any[]>(sql, params);
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
