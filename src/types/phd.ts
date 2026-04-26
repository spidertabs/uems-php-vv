// src/types/phd.ts
// ─────────────────────────────────────────────────────────────
//  PhD Viva Voce — Type Definitions
//  Mirrors the DB schema exactly (Section 11, UEMS-PHD-VV v3.1)
// ─────────────────────────────────────────────────────────────

// ── ENUM union types (mirror DB ENUMs) ───────────────────────

export type CandidateStatus =
  | 'enrolled'
  | 'thesis_submitted'
  | 'viva_scheduled'
  | 'viva_completed'
  | 'corrections_pending'
  | 'corrections_submitted'
  | 'awarded'
  | 'withdrawn';

export type VivaStatus =
  | 'scheduled'
  | 'postponed'
  | 'cancelled'
  | 'in_progress'
  | 'completed';

export type VivaOutcome =
  | 'pass'
  | 'pass_with_minor_corrections'
  | 'pass_with_major_corrections'
  | 'fail';

export type ExaminerRole =
  | 'chairperson'
  | 'internal_examiner'
  | 'external_examiner';

// ── Base table shapes ─────────────────────────────────────────

export interface PhdCandidate {
  id: number;
  user_id: number;
  registration_number: string;
  thesis_title: string;
  programme_id: number;
  supervisor_id: number | null;
  co_supervisor_id: number | null;
  enrolment_year: number | null;
  status: CandidateStatus;
  deleted_at: string | null;
  deleted_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ThesisSubmission {
  id: number;
  candidate_id: number;
  file_name: string;
  file_path: string;
  file_size_kb: number | null;
  version: number;
  submission_notes: string | null;
  submitted_at: string;
}

export interface VivaSchedule {
  id: number;
  candidate_id: number;
  thesis_id: number;
  scheduled_date: string;   // 'YYYY-MM-DD'
  scheduled_time: string;   // 'HH:MM:SS'
  venue: string;
  duration_minutes: number;
  status: VivaStatus;
  postponement_reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface VivaExaminer {
  id: number;
  viva_id: number;
  examiner_id: number;
  role: ExaminerRole;
  panel_slot: number | null;
  confirmed: boolean;
  confirmed_at: string | null;
  notified_at: string | null;
}

export interface VivaEvaluation {
  id: number;
  viva_id: number;
  examiner_id: number;
  originality_score: number | null;
  methodology_score: number | null;
  presentation_score: number | null;
  literature_score: number | null;
  overall_score: number | null;   // GENERATED column — read-only
  strengths: string | null;
  weaknesses: string | null;
  recommended_corrections: string | null;
  general_comments: string | null;
  submitted_at: string | null;
  is_submitted: boolean;
}

export interface VivaRecommendation {
  id: number;
  viva_id: number;
  outcome: VivaOutcome;
  correction_deadline: string | null;   // 'YYYY-MM-DD'
  final_comments: string | null;
  issued_by: number;
  issued_at: string;
}

// ── Composite / joined types ──────────────────────────────────

/** Full candidate row joined with user, programme, and supervisor names */
export interface CandidateWithDetails extends PhdCandidate {
  // from staff JOIN
  candidate_name: string;
  candidate_email: string;
  // from programmes JOIN
  programme_name: string;
  programme_code: string;
  // from supervisor user JOIN (nullable)
  supervisor_name: string | null;
  supervisor_email: string | null;
  // from co_supervisor user JOIN (nullable)
  co_supervisor_name: string | null;
  // counts
  thesis_count: number;
  viva_count: number;
}

/** Examiner row joined with user details */
export interface VivaExaminerWithUser extends VivaExaminer {
  examiner_name: string;
  examiner_email: string;
  examiner_role_title: string; // user.role e.g. 'hod', 'lecturer'
}

/** Viva evaluation row joined with examiner name */
export interface VivaEvaluationWithExaminer extends VivaEvaluation {
  examiner_name: string;
  examiner_panel_role: ExaminerRole;
}

/** Aggregate evaluation summary for a viva */
export interface VivaEvaluationSummary {
  viva_id: number;
  total_examiners: number;
  submitted_count: number;
  avg_originality: number | null;
  avg_methodology: number | null;
  avg_presentation: number | null;
  avg_literature: number | null;
  avg_overall: number | null;
}

/** Full viva detail — schedule + candidate + panel + evaluations + recommendation */
export interface VivaWithFullDetails extends VivaSchedule {
  // candidate
  registration_number: string;
  thesis_title: string;
  candidate_name: string;
  candidate_status: CandidateStatus;
  // supervisor
  supervisor_name: string | null;
  // programme
  programme_name: string;
  // panel
  examiners: VivaExaminerWithUser[];
  evaluations: VivaEvaluationWithExaminer[];
  evaluation_summary: VivaEvaluationSummary;
  recommendation: VivaRecommendation | null;
}

/** Result shape of sp_get_viva_report — two result sets */
export interface VivaReportFull {
  schedule: {
    id: number;
    scheduled_date: string;
    scheduled_time: string;
    venue: string;
    duration_minutes: number;
    status: VivaStatus;
    registration_number: string;
    thesis_title: string;
    candidate_name: string;
    supervisor_name: string | null;
    programme_name: string;
    outcome: VivaOutcome | null;
    correction_deadline: string | null;
    final_comments: string | null;
  };
  evaluations: Array<{
    examiner_name: string;
    examiner_role: ExaminerRole;
    originality_score: number | null;
    methodology_score: number | null;
    presentation_score: number | null;
    literature_score: number | null;
    overall_score: number | null;
    strengths: string | null;
    weaknesses: string | null;
    recommended_corrections: string | null;
    general_comments: string | null;
    submitted_at: string | null;
  }>;
}

// ── UI helper maps ────────────────────────────────────────────

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  enrolled: 'Enrolled',
  thesis_submitted: 'Thesis Submitted',
  viva_scheduled: 'Viva Scheduled',
  viva_completed: 'Viva Completed',
  corrections_pending: 'Corrections Pending',
  corrections_submitted: 'Corrections Submitted',
  awarded: 'Awarded',
  withdrawn: 'Withdrawn',
};

export const CANDIDATE_STATUS_COLORS: Record<CandidateStatus, string> = {
  enrolled:               'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  thesis_submitted:       'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  viva_scheduled:         'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  viva_completed:         'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  corrections_pending:    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  corrections_submitted:  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  awarded:                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  withdrawn:              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const VIVA_STATUS_COLORS: Record<VivaStatus, string> = {
  scheduled:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  postponed:   'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  cancelled:   'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export const OUTCOME_COLORS: Record<VivaOutcome, string> = {
  pass:                         'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pass_with_minor_corrections:  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  pass_with_major_corrections:  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  fail:                         'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const OUTCOME_LABELS: Record<VivaOutcome, string> = {
  pass:                         'Pass',
  pass_with_minor_corrections:  'Pass — Minor Corrections',
  pass_with_major_corrections:  'Pass — Major Corrections',
  fail:                         'Fail',
};

export const EXAMINER_ROLE_LABELS: Record<ExaminerRole, string> = {
  chairperson:       'Chairperson',
  internal_examiner: 'Internal Examiner',
  external_examiner: 'External Examiner',
};