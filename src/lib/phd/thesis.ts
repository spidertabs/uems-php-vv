/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/phd/thesis.ts
import { query } from '@/lib/db';
import type { ThesisSubmission } from '@/types/phd';

export async function getThesisByCandidateId(candidateId: number): Promise<ThesisSubmission[]> {
  return query<ThesisSubmission[]>(
    'SELECT * FROM thesis_submissions WHERE candidate_id = ? ORDER BY version DESC',
    [candidateId]
  );
}

export async function getLatestThesis(candidateId: number): Promise<ThesisSubmission | null> {
  const rows = await query<ThesisSubmission[]>(
    'SELECT * FROM thesis_submissions WHERE candidate_id = ? ORDER BY version DESC LIMIT 1',
    [candidateId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function getThesisById(id: number): Promise<ThesisSubmission | null> {
  const rows = await query<ThesisSubmission[]>(
    'SELECT * FROM thesis_submissions WHERE id = ? LIMIT 1',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createThesisSubmission(data: {
  candidate_id: number;
  file_name: string;
  file_path: string;
  file_size_kb?: number | null;
  submission_notes?: string | null;
}): Promise<number> {
  // Trigger trg_thesis_version_increment auto-increments version
  const result = await query<any>(
    `INSERT INTO thesis_submissions
     (candidate_id, file_name, file_path, file_size_kb, submission_notes, submitted_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      data.candidate_id,
      data.file_name,
      data.file_path,
      data.file_size_kb ?? null,
      data.submission_notes ?? null,
    ]
  );
  return result.insertId;
}
