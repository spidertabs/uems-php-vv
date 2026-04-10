/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/index.ts

// =====================================================
// ORGANIZATIONAL STRUCTURE TYPES
// =====================================================

export interface College {
  id: number;
  code: string;
  name: string;
  abbrv: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: number;
  college_id: number;
  code: string;
  name: string;
  abbrv: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Programme {
  id: number;
  code: string;
  name: string;
  level: 'diploma' | 'bachelors' | 'masters' | 'phd';
  duration_years: number | null;
  department_id: number | null;
  college_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// USER MANAGEMENT TYPES
// =====================================================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'lecturer' | 'hod' | 'dean' | 'exam_master' | 'admin';
  department_id: number | null;
  college_id: number | null;
  phone: string | null;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: number;
  session_id: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
}

// =====================================================
// ACADEMIC CONTENT TYPES
// =====================================================

export interface Course {
  id: number;
  code: string;
  title: string;
  level: number | null;
  semester: number | null;
  credit_units: number | null;
  college_id: number | null;
  department_id: number | null;
  hod_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StudyUnit {
  id: number;
  course_id: number;
  code: string;
  name: string;
  title?: string; // Alias for name
  description: string | null;
  sequence_order: number;
  learning_outcomes: string | null;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// PERMISSIONS TYPES
// =====================================================

export interface LecturerPermission {
  id: number;
  lecturer_id: number;
  course_id: number;
  granted_by: number;
  can_add_questions: boolean;
  can_create_papers: boolean;
  can_edit_questions: boolean;
  granted_at: Date;
  expires_at: Date | null;
  is_active: boolean;
  notes: string | null;
}

// =====================================================
// QUESTION BANK TYPES
// =====================================================

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'practical'
  | 'case_study';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type BloomTaxonomy =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export interface QuestionOption {
  text: string;
  is_correct?: boolean;
}

export interface Question {
  id: number;
  course_id: number;
  study_unit_id: number | null;
  created_by: number;
  question_type: QuestionType;
  difficulty_level: DifficultyLevel;
  question_text: string;
  options: string | string[] | QuestionOption[] | null; // Can be JSON string or parsed array
  correct_answer: string | null;
  marks: number;
  time_allocation: number | null;
  learning_outcome: string | null;
  keywords: string | null;
  bloom_taxonomy: BloomTaxonomy | null;
  bloom_level?: string; // Alias for bloom_taxonomy
  tags: string | string[] | null; // Can be JSON string or parsed array
  usage_count: number;
  is_active: boolean;
  approved_by: number | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Additional fields from joins
  course_code?: string;
  course_title?: string;
  study_unit_title?: string;
  created_by_name?: string;
  // For MCQ shuffling
  shuffledOptions?: string[];
  optionOrder?: number[];
}

// =====================================================
// EXAM PAPER TYPES
// =====================================================

export type ExamType = 'TEST' | 'CAT' | 'FINAL';

export type PaperStatus =
  | 'draft'
  | 'submitted'
  | 'hod_review'
  | 'hod_approved'
  | 'hod_rejected'
  | 'dean_review'
  | 'dean_approved'
  | 'dean_rejected'
  | 'ready_for_print'
  | 'printing'
  | 'printed'
  | 'published';

export interface ExamPaper {
  id: number;
  paper_code: string;
  course_id: number;
  created_by: number;
  exam_type: ExamType;
  academic_year: number;
  semester: number;
  exam_date: Date | null;
  duration: number | null;
  total_marks: number;
  instructions: string | null;
  footer_text: string | null;
  status: PaperStatus;
  hod_id: number | null;
  hod_approved_at: Date | null;
  dean_id: number | null;
  dean_approved_at: Date | null;
  exam_master_id: number | null;
  printed_at: Date | null;
  print_quantity: number;
  submitted_at: Date | null;
  published_at: Date | null;
  version: number;
  is_locked: boolean;
  metadata: string | Record<string, any> | null; // Can be JSON string or parsed object
  created_at: Date;
  updated_at: Date;
  // Additional fields from joins
  course_code?: string;
  course_title?: string;
  creator_name?: string;
  title?: string;
}

export interface ExamPaperProgramme {
  id: number;
  exam_paper_id: number;
  programme_id: number;
  created_at: Date;
}

// =====================================================
// EXAM PAPER QUESTIONS (WITH SUB-QUESTIONS SUPPORT)
// =====================================================

export interface ExamPaperQuestion {
  id: number;
  exam_paper_id: number;
  question_id: number;
  // Section and numbering
  section: string;
  question_number: string;
  sub_question_label: string | null;
  display_number: string | null;
  // Marks allocation
  marks: number;
  sub_marks: string | null;
  // Question requirements
  is_required: boolean;
  is_choice: boolean;
  choice_group: string | null;
  choice_instructions: string | null;
  // Hierarchy and ordering
  sequence_order: number;
  parent_question_id: number | null;
  indentation_level: number;
  can_have_sub_questions: boolean;
  // MCQ option shuffling
  option_order: number[] | string | null; // Can be JSON string or parsed array
  // Additional metadata
  custom_instructions: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// Enhanced type with question details and hierarchy
export interface PaperQuestion extends ExamPaperQuestion {
  question: Question;
  children?: PaperQuestion[];
}

// For rendering hierarchical questions
export interface HierarchicalQuestion {
  main: PaperQuestion;
  subQuestions: PaperQuestion[];
}

// =====================================================
// WORKFLOW & APPROVALS TYPES
// =====================================================

export interface WorkflowHistory {
  id: number;
  exam_paper_id: number;
  action:
    | 'created'
    | 'submitted'
    | 'hod_approved'
    | 'hod_rejected'
    | 'dean_approved'
    | 'dean_rejected'
    | 'ready_for_print'
    | 'printing_started'
    | 'printed'
    | 'published'
    | 'returned'
    | 'updated';
  from_status: string | null;
  to_status: string;
  actor_id: number;
  actor_role: string;
  comments: string | null;
  metadata: string | Record<string, any> | null; // Can be JSON string or parsed object
  created_at: Date;
}

export interface PaperComment {
  id: number;
  exam_paper_id: number;
  user_id: number;
  comment_type:
    | 'feedback'
    | 'revision_request'
    | 'hod_approval_note'
    | 'dean_note'
    | 'print_instruction'
    | 'general';
  comment: string;
  is_resolved: boolean;
  parent_comment_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export interface Notification { 
  id: number;
  user_id: number;
  type:
    | 'paper_submitted'
    | 'paper_approved'
    | 'paper_rejected'
    | 'paper_returned'
    | 'permission_granted'
    | 'approval_required'
    | 'ready_for_print'
    | 'print_completed'
    | 'comment_added'
    | 'deadline_reminder'
    | 'general';
  title: string;
  message: string;
  related_paper_id: number | null;
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: boolean;
  read_at: Date | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url: string | null;
  metadata: string | Record<string, any> | null; // Can be JSON string or parsed object
  created_at: Date;
}

// =====================================================
// AUDIT & LOGGING TYPES
// =====================================================

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: string | Record<string, any> | null; // Can be JSON string or parsed object
  new_values: string | Record<string, any> | null; // Can be JSON string or parsed object
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface HodPendingApproval {
  id: number;
  paper_code: string;
  status: string;
  exam_type: string;
  course_code: string;
  course_name: string;
  lecturer_name: string;
  submitted_at: Date | null;
  hod_id: number | null;
  department_name: string | null;
  programmes: string | null;
}

export interface PaperReadyForPrint {
  id: number;
  paper_code: string;
  status: string;
  exam_type: string;
  exam_date: Date | null;
  course_code: string;
  course_name: string;
  total_marks: number;
  duration: number | null;
  hod_approved_at: Date | null;
  print_quantity: number;
  department_name: string | null;
  college_name: string | null;
  programmes: string | null;
  programme_names: string | null;
}

export interface LecturerPermissionSummary {
  lecturer_id: number;
  lecturer_name: string;
  course_code: string;
  course_name: string;
  can_add_questions: boolean;
  can_create_papers: boolean;
  granted_at: Date;
  expires_at: Date | null;
  granted_by_name: string;
}

export interface PapersByStatusSummary {
  status: string;
  exam_type: string;
  count: number;
  oldest_paper: Date;
  newest_paper: Date;
}

export interface ProgrammeSummary {
  id: number;
  code: string;
  name: string;
  level: string;
  duration_years: number | null;
  department_name: string | null;
  college_name: string | null;
  total_exam_papers: number;
  is_active: boolean;
}

export interface PaperByProgramme {
  programme_code: string;
  programme_name: string;
  status: string;
  exam_type: string;
  academic_year: number;
  semester: number;
  course_code: string;
  course_title: string;
  paper_code: string;
  exam_date: Date | null;
  created_by_name: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// FORM & UI TYPES
// =====================================================

export interface QuestionFilter {
  course_id?: number;
  study_unit_id?: number;
  question_type?: QuestionType;
  difficulty_level?: DifficultyLevel;
  bloom_taxonomy?: BloomTaxonomy;
  search?: string;
  is_active?: boolean;
}

export interface PaperFilter {
  course_id?: number;
  exam_type?: ExamType;
  academic_year?: number;
  semester?: number;
  status?: PaperStatus;
  created_by?: number;
}

export interface QuestionFormData {
  course_id: number;
  study_unit_id?: number;
  question_type: QuestionType;
  difficulty_level: DifficultyLevel;
  question_text: string;
  options?: QuestionOption[];
  correct_answer?: string;
  marks: number;
  time_allocation?: number;
  learning_outcome?: string;
  keywords?: string;
  bloom_taxonomy: BloomTaxonomy;
  tags?: string[];
}

export interface PaperFormData {
  paper_code: string;
  course_id: number;
  exam_type: ExamType;
  academic_year: number;
  semester: number;
  exam_date?: string;
  duration?: number;
  instructions?: string;
  footer_text?: string;
  programme_ids?: number[];
}

export interface AddQuestionToPaperData {
  question_id: number;
  marks: number;
  section: string;
  parent_question_id?: number | null;
  sub_question_label?: string | null;
  sub_marks?: string | null;
  option_order?: number[] | null;
  is_required?: boolean;
  is_choice?: boolean;
  choice_group?: string | null;
  choice_instructions?: string | null;
  custom_instructions?: string | null;
}

export interface CollegeFormData {
  code: string;
  name: string;
  abbrv: string;
  description?: string;
}

export interface DepartmentFormData {
  college_id: number;
  code: string;
  name: string;
  abbrv: string;
  description?: string;
}

export interface ProgrammeFormData {
  code: string;
  name: string;
  level: 'diploma' | 'bachelors' | 'masters' | 'phd';
  duration_years?: number;
  department_id?: number;
  college_id?: number;
  description?: string;
  is_active?: boolean;
}

export interface UserFormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: 'lecturer' | 'hod' | 'dean' | 'exam_master' | 'admin';
  department_id?: number;
  college_id?: number;
  phone?: string;
  is_active?: boolean;
}

export interface PermissionFormData {
  lecturer_id: number;
  course_id: number;
  can_add_questions: boolean;
  can_create_papers: boolean;
  can_edit_questions: boolean;
  expires_at?: string;
  notes?: string;
}

// =====================================================
// WORKFLOW & NOTIFICATION TYPES
// =====================================================

export interface WorkflowAction {
  paper_id: number;
  action: 'submit' | 'approve' | 'reject' | 'return' | 'print' | 'publish';
  comments?: string;
  performed_by: number;
  performed_at: string;
}

// =====================================================
// STATISTICS & ANALYTICS TYPES
// =====================================================

export interface DashboardStats {
  total_questions: number;
  total_papers: number;
  pending_approvals: number;
  published_papers: number;
  recent_activity: {
    questions_added: number;
    papers_created: number;
    papers_approved: number;
  };
}

export interface QuestionStats {
  by_type: Record<QuestionType, number>;
  by_difficulty: Record<DifficultyLevel, number>;
  by_bloom: Record<BloomTaxonomy, number>;
  total_active: number;
  total_inactive: number;
}

export interface PaperStats {
  by_status: Record<PaperStatus, number>;
  by_exam_type: Record<ExamType, number>;
  by_semester: Record<number, number>;
  average_marks: number;
  total_published: number;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// =====================================================
// CONTEXT TYPES
// =====================================================

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}