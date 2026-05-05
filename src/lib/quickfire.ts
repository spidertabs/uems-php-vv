import { query } from './db';
import { 
  QuickfireAssessment, 
  QuickfireQuestion, 
  QuickfireAttempt, 
  QuickfireAnswer,
  QuickfireResultSummary
} from '../types/quickfire';

// =====================================================
// ASSESSMENT FUNCTIONS
// =====================================================

export async function getAssessmentsByLecturer(lecturerId: number): Promise<QuickfireAssessment[]> {
  const sql = `
    SELECT qa.id, qa.course_id, qa.lecturer_id, qa.title, qa.description, qa.duration_minutes, qa.is_active, qa.show_results, qa.created_at, qa.updated_at, c.code as course_code, c.title as course_title
    FROM quickfire_assessments qa
    JOIN courses c ON qa.course_id = c.id
    WHERE qa.lecturer_id = ?
    ORDER BY qa.created_at DESC
  `;
  return await query(sql, [lecturerId]) as QuickfireAssessment[];
}

export async function getAssessmentById(id: number): Promise<QuickfireAssessment | null> {
  const sql = `
    SELECT qa.id, qa.course_id, qa.lecturer_id, qa.title, qa.description, qa.duration_minutes, qa.is_active, qa.show_results, qa.created_at, qa.updated_at, c.code as course_code, c.title as course_title, s.first_name || ' ' || s.last_name as lecturer_name
    FROM quickfire_assessments qa
    JOIN courses c ON qa.course_id = c.id
    JOIN staff s ON qa.lecturer_id = s.id
    WHERE qa.id = ?
  `;
  const results = await query(sql, [id]) as QuickfireAssessment[];
  return results.length > 0 ? results[0] : null;
}

export async function createAssessment(data: Partial<QuickfireAssessment>): Promise<number> {
  const sql = `
    INSERT INTO quickfire_assessments (course_id, lecturer_id, title, description, duration_minutes, is_active, show_results)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    data.course_id,
    data.lecturer_id,
    data.title,
    data.description || null,
    data.duration_minutes || null,
    data.is_active !== undefined ? data.is_active : true,
    data.show_results !== undefined ? data.show_results : true
  ]) as any;
  return result.insertId;
}

export async function updateAssessment(id: number, data: Partial<QuickfireAssessment>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(data.duration_minutes); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
  if (data.show_results !== undefined) { fields.push('show_results = ?'); values.push(data.show_results); }

  if (fields.length === 0) return;

  const sql = `UPDATE quickfire_assessments SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
  await query(sql, values);
}

// =====================================================
// QUESTION FUNCTIONS
// =====================================================

export async function getQuestionsByAssessment(assessmentId: number): Promise<QuickfireQuestion[]> {
  const sql = `
    SELECT * FROM quickfire_questions 
    WHERE assessment_id = ? 
    ORDER BY sequence_order ASC, id ASC
  `;
  return await query(sql, [assessmentId]) as QuickfireQuestion[];
}

export async function addQuestion(data: Partial<QuickfireQuestion>): Promise<number> {
  const sql = `
    INSERT INTO quickfire_questions (assessment_id, question_text, question_type, options, correct_answer, marks, min_words, max_words, sequence_order)
    VALUES (?, ?, ?::question_type, ?::jsonb, ?, ?, ?, ?, ?)
  `;
  const options = data.options ? JSON.stringify(data.options) : null;
  const result = await query(sql, [
    data.assessment_id,
    data.question_text,
    data.question_type || 'multiple_choice',
    options,
    data.correct_answer || null,
    data.marks || 1,
    data.min_words || null,
    data.max_words || null,
    data.sequence_order || 0
  ]) as any;
  return result.insertId;
}

export async function updateQuestion(id: number, data: Partial<QuickfireQuestion>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.question_text !== undefined) { fields.push('question_text = ?'); values.push(data.question_text); }
  if (data.question_type !== undefined) { fields.push('question_type = ?::question_type'); values.push(data.question_type); }
  if (data.options !== undefined) { fields.push('options = ?::jsonb'); values.push(data.options ? JSON.stringify(data.options) : null); }
  if (data.correct_answer !== undefined) { fields.push('correct_answer = ?'); values.push(data.correct_answer); }
  if (data.marks !== undefined) { fields.push('marks = ?'); values.push(data.marks); }
  if (data.min_words !== undefined) { fields.push('min_words = ?'); values.push(data.min_words); }
  if (data.max_words !== undefined) { fields.push('max_words = ?'); values.push(data.max_words); }
  if (data.sequence_order !== undefined) { fields.push('sequence_order = ?'); values.push(data.sequence_order); }

  if (fields.length === 0) return;

  const sql = `UPDATE quickfire_questions SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
  await query(sql, values);
}

export async function deleteQuestion(id: number): Promise<void> {
  await query('DELETE FROM quickfire_questions WHERE id = ?', [id]);
}

// =====================================================
// RESULTS FUNCTIONS
// =====================================================

export async function getAssessmentResults(assessmentId: number): Promise<QuickfireResultSummary[]> {
  const sql = `SELECT * FROM vw_quickfire_results WHERE assessment_id = ? ORDER BY total_score DESC`;
  return await query(sql, [assessmentId]) as QuickfireResultSummary[];
}

export async function getDetailedAnswers(attemptId: number): Promise<any[]> {
  const sql = `
    SELECT * FROM vw_quickfire_detailed_answers 
    WHERE attempt_id = ? 
    ORDER BY sequence_order ASC
  `;
  return await query(sql, [attemptId]) as any[];
}
