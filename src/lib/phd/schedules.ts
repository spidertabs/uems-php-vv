/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/schedules.ts
import { query } from '@/lib/db';
import type { VivaSchedule, VivaStatus } from '@/types/phd';

interface ScheduleFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  candidate_id?: number;
}

export async function getAllSchedules(filters?: ScheduleFilters): Promise<any[]> {
  let sql = `SELECT * FROM vw_viva_schedule_overview WHERE 1=1`;
  const params: (string | number)[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.date_from) {
    sql += ' AND scheduled_date >= ?';
    params.push(filters.date_from);
  }
  if (filters?.date_to) {
    sql += ' AND scheduled_date <= ?';
    params.push(filters.date_to);
  }
  if (filters?.candidate_id) {
    sql += ' AND candidate_id = ?';
    params.push(filters.candidate_id);
  }

  sql += ' ORDER BY scheduled_date ASC, scheduled_time ASC';
  return query<any[]>(sql, params);
}

export async function getScheduleById(vivaId: number): Promise<any | null> {
  const rows = await query<any[]>(
    `SELECT
       vs.*,
       pc.registration_number, pc.thesis_title, pc.status AS candidate_status,
       CONCAT(u.first_name, ' ', u.last_name) AS candidate_name,
       p.name AS programme_name,
       sup.first_name AS supervisor_first_name,
       sup.last_name  AS supervisor_last_name
     FROM viva_schedules vs
     JOIN phd_candidates pc ON vs.candidate_id = pc.id
     JOIN users u ON pc.user_id = u.id
     JOIN programmes p ON pc.programme_id = p.id
     LEFT JOIN users sup ON pc.supervisor_id = sup.id
     WHERE vs.id = ?
     LIMIT 1`,
    [vivaId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createSchedule(data: {
  candidate_id: number;
  thesis_id: number;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  duration_minutes: number;
  created_by: number;
}): Promise<number> {
  const result = await query<any>(
    `INSERT INTO viva_schedules
     (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes,
      status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NOW())`,
    [
      data.candidate_id, data.thesis_id, data.scheduled_date,
      data.scheduled_time, data.venue, data.duration_minutes, data.created_by,
    ]
  );
  return result.insertId;
}

export async function updateScheduleStatus(
  vivaId: number,
  status: VivaStatus,
  postponement_reason?: string
): Promise<void> {
  if (postponement_reason !== undefined) {
    await query(
      'UPDATE viva_schedules SET status = ?, postponement_reason = ?, updated_at = NOW() WHERE id = ?',
      [status, postponement_reason, vivaId]
    );
  } else {
    await query(
      'UPDATE viva_schedules SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, vivaId]
    );
  }
}

export async function updateSchedule(
  vivaId: number,
  data: Partial<Pick<VivaSchedule, 'scheduled_date' | 'scheduled_time' | 'venue' | 'duration_minutes'>>
): Promise<void> {
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), vivaId];
  await query(`UPDATE viva_schedules SET ${fields}, updated_at = NOW() WHERE id = ?`, values);
}
