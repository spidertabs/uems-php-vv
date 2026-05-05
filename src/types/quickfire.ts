export type QuickfireQuestionType = 'multiple_choice' | 'essay' | 'short_answer';
export interface QuickfireAssessment {
  id: number;
  course_id: number;
  lecturer_id: number;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  show_results: boolean;
  created_at: string;
  updated_at: string;
  course_code?: string;
  course_title?: string;
  lecturer_name?: string;
}

export interface QuickfireQuestion {
  id: number;
  assessment_id: number;
  question_text: string;
  question_type: QuickfireQuestionType;
  options: string[] | null;
  correct_answer: string | null;
  marks: number;
  min_words: number | null;
  max_words: number | null;
  sequence_order: number;
  created_at: string;
}

export interface QuickfireAttempt {
  id: number;
  assessment_id: number;
  student_id: number;
  started_at: string;
  submitted_at: string | null;
  total_score: number;
  status: 'in_progress' | 'submitted';
  student_name?: string;
  registration_number?: string;
}

export interface QuickfireAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer_text: string | null;
  is_correct: boolean | null;
  marks_obtained: number;
  created_at: string;
}

export interface QuickfireResultSummary {
  assessment_id: number;
  assessment_title: string;
  course_code: string;
  course_title: string;
  registration_number: string;
  student_name: string;
  attempt_id: number;
  started_at: string;
  submitted_at: string | null;
  total_score: number;
  status: string;
  max_marks: number;
}
