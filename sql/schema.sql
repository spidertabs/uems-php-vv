-- ============================================================
--  UEMS - University Exam Management System
--  Complete MySQL Database Schema with Sub-Questions Support
--  Version: 2.2 (FIXED - All Issues Resolved)
--  Last Updated: 2025
-- ============================================================
-- ORGANIZATIONAL STRUCTURE
-- =====================================================

-- Colleges / Schools  Table (SOMAC, SONAS, CEM, SOL, etc.)
CREATE TABLE colleges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments Table (CS, IT, STATISTICS etc under a College)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL COMMENT 'College where the department belongs',
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    INDEX idx_code (code),
    INDEX idx_college (college_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Programmes Table (BIT, DIT, BSTAT, DSTAT, MBA, BBA, BOL, etc.)
CREATE TABLE programmes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Programme code (e.g., BIT, DIT, BSTAT)',
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Full programme name',
    level ENUM('diploma', 'bachelors', 'masters', 'phd') NOT NULL,
    duration_years INT COMMENT 'Standard duration in years',
    department_id INT,
    college_id INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_department (department_id),
    INDEX idx_college (college_id),
    INDEX idx_level (level),
    INDEX idx_active (is_active),
    INDEX idx_level_active (level, is_active),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- Users Table (RBAC Implementation)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('lecturer', 'hod', 'dean', 'exam_master', 'admin') NOT NULL DEFAULT 'lecturer',
    department_id INT,
    college_id INT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department_id),
    INDEX idx_college (college_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions Table
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_expires (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ACADEMIC CONTENT
-- =====================================================

-- Courses Table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    level INT,
    semester INT,
    credit_units INT,
    college_id INT,
    department_id INT,
    hod_id INT COMMENT 'HOD who created/manages this course',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_department (department_id),
    INDEX idx_college (college_id),
    INDEX idx_hod (hod_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Study Units Table (Created by HOD, nested under courses)
CREATE TABLE study_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INT DEFAULT 0,
    learning_outcomes TEXT,
    created_by INT DEFAULT 1 COMMENT 'HOD who created this unit',
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_course_unit (course_id, code),
    INDEX idx_course (course_id),
    INDEX idx_code (code),
    INDEX idx_created_by (created_by),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- QUESTION BANK
-- =====================================================

-- Questions Table (Created by HOD or authorized Lecturers)
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    study_unit_id INT,
    created_by INT NOT NULL COMMENT 'HOD or Lecturer with permission',
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'practical', 'case_study') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    question_text TEXT NOT NULL,
    options JSON COMMENT 'For MCQs: array of options',
    correct_answer TEXT,
    marks INT NOT NULL DEFAULT 1,
    time_allocation INT COMMENT 'Time in minutes',
    learning_outcome TEXT,
    keywords TEXT,
    bloom_taxonomy ENUM('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'),
    tags JSON,
    usage_count INT DEFAULT 0,
    avg_student_score DECIMAL(5,2) COMMENT 'Average student performance',
    difficulty_rating DECIMAL(3,2) COMMENT 'Actual difficulty based on usage',
    is_active BOOLEAN DEFAULT TRUE,
    approved_by INT COMMENT 'HOD who approved this question',
    approved_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (study_unit_id) REFERENCES study_units(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_options_json CHECK (options IS NULL OR JSON_VALID(options)),
    CONSTRAINT chk_tags_json CHECK (tags IS NULL OR JSON_VALID(tags)),
    INDEX idx_course (course_id),
    INDEX idx_study_unit (study_unit_id),
    INDEX idx_created_by (created_by),
    INDEX idx_type (question_type),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_approved_by (approved_by),
    INDEX idx_questions_course_active (course_id, is_active),
    INDEX idx_deleted (deleted_at),
    FULLTEXT idx_question_text (question_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EXAM PAPERS
-- =====================================================

-- Exam Papers Table (Created by Lecturers, Approved by HOD)
CREATE TABLE exam_papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Paper identity
    paper_code VARCHAR(50) NOT NULL UNIQUE,
    -- Relationships
    course_id INT NOT NULL,
    created_by INT NOT NULL COMMENT 'Lecturer who created the paper',
    -- Exam details
    exam_type ENUM('TEST', 'CAT', 'FINAL') NOT NULL,
    academic_year INT NOT NULL,
    semester INT NOT NULL,
    exam_date DATE,
    duration INT COMMENT 'Duration in minutes',
    total_marks INT DEFAULT 0,
    -- Display content (PRINT-RELATED)
    instructions TEXT COMMENT 'Instructions shown at the top of the paper',
    footer_text VARCHAR(255) DEFAULT NULL
        COMMENT 'Footer text shown at bottom (defaults to "*** END OF EXAMINATION ***" if NULL)',
    -- Workflow status
    status ENUM(
        'draft', 'submitted', 'hod_review', 'hod_approved', 'hod_rejected',
        'dean_review', 'dean_approved', 'dean_rejected',
        'ready_for_print', 'printing', 'printed', 'published'
    ) DEFAULT 'draft',
    -- Approval tracking
    hod_id INT COMMENT 'HOD who needs to approve',
    hod_approved_at TIMESTAMP NULL,
    dean_id INT COMMENT 'Dean overseeing approval',
    dean_approved_at TIMESTAMP NULL,
    exam_master_id INT COMMENT 'Exam Master handling printing',
    printed_at TIMESTAMP NULL,
    print_quantity INT DEFAULT 0,
    -- Workflow timestamps
    submitted_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    -- Versioning & locking
    version INT DEFAULT 1,
    is_locked BOOLEAN DEFAULT FALSE,
    -- Extra data
    metadata JSON COMMENT 'Additional paper metadata',
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    -- Foreign keys
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (dean_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (exam_master_id) REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT chk_metadata_json CHECK (metadata IS NULL OR JSON_VALID(metadata)),
    -- Indexes
    INDEX idx_paper_code (paper_code),
    INDEX idx_course (course_id),
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_exam_type (exam_type),
    INDEX idx_hod (hod_id),
    INDEX idx_dean (dean_id),
    INDEX idx_exam_master (exam_master_id),
    INDEX idx_academic_year (academic_year, semester),
    INDEX idx_papers_status_type (status, exam_type),
    INDEX idx_papers_creator_status (created_by, status),
    INDEX idx_papers_hod_status (hod_id, status),
    INDEX idx_papers_creator_date (created_by, exam_date),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paper Versions Table (Complete history of paper changes)
CREATE TABLE exam_paper_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT NOT NULL,
    version_number INT NOT NULL,
    snapshot JSON NOT NULL COMMENT 'Complete paper state at this version',
    changes_summary TEXT COMMENT 'Description of what changed',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_paper_version (exam_paper_id, version_number),
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_created_by (created_by),
    INDEX idx_version (version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Paper Programmes Junction Table (Many-to-Many)
CREATE TABLE exam_paper_programmes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT NOT NULL,
    programme_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_paper_programme (exam_paper_id, programme_id),
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_programme (programme_id),
    INDEX idx_paper_programmes_paper (exam_paper_id),
    INDEX idx_paper_programmes_programme (programme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EXAM PAPER QUESTIONS (WITH SUB-QUESTIONS SUPPORT)
-- =====================================================

CREATE TABLE exam_paper_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT NOT NULL,
    question_id INT NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    question_number VARCHAR(20) NOT NULL,
    sub_question_label VARCHAR(20),
    display_number VARCHAR(50),
    marks INT NOT NULL,
    sub_marks VARCHAR(50),
    is_required BOOLEAN DEFAULT TRUE,
    is_choice BOOLEAN DEFAULT FALSE,
    choice_group VARCHAR(20),
    choice_instructions VARCHAR(255),
    sequence_order INT NOT NULL,
    parent_question_id INT,
    parent_question_key INT
        GENERATED ALWAYS AS (IFNULL(parent_question_id, 0)) STORED,
    indentation_level INT DEFAULT 0,
    can_have_sub_questions BOOLEAN DEFAULT TRUE
        COMMENT 'Whether this question can have sub-questions (user-controlled)',
    option_order JSON,
    custom_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    -- Foreign Keys
    CONSTRAINT fk_epq_exam_paper
        FOREIGN KEY (exam_paper_id)
        REFERENCES exam_papers(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_epq_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_epq_parent
        FOREIGN KEY (parent_question_id)
        REFERENCES exam_paper_questions(id)
        ON DELETE CASCADE,
    -- Uniqueness constraints (MariaDB-safe)
    UNIQUE KEY unique_paper_section_sequence (
        exam_paper_id,
        section,
        sequence_order,
        parent_question_key
    ),
    UNIQUE KEY unique_question_per_parent (
        exam_paper_id,
        question_id,
        parent_question_key
    ),
    -- Indexes
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_question (question_id),
    INDEX idx_parent (parent_question_id),
    INDEX idx_section (section),
    INDEX idx_sequence (sequence_order),
    INDEX idx_indentation (indentation_level)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- PERMISSIONS SYSTEM
-- =====================================================

-- Lecturer Permissions (HOD grants permission to lecturers to add questions)
CREATE TABLE lecturer_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecturer_id INT NOT NULL,
    course_id INT NOT NULL,
    granted_by INT NOT NULL COMMENT 'HOD who granted permission',
    can_add_questions BOOLEAN DEFAULT TRUE,
    can_create_papers BOOLEAN DEFAULT TRUE,
    can_edit_questions BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_lecturer_course (lecturer_id, course_id),
    INDEX idx_lecturer (lecturer_id),
    INDEX idx_course (course_id),
    INDEX idx_granted_by (granted_by),
    INDEX idx_active (is_active),
    INDEX idx_permissions_active (lecturer_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- WORKFLOW & APPROVALS
-- =====================================================

-- Workflow History Table (Audit Trail)
CREATE TABLE workflow_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT NOT NULL,
    action ENUM('created', 'submitted', 'hod_approved', 'hod_rejected', 
                'dean_approved', 'dean_rejected', 'ready_for_print', 
                'printing_started', 'printed', 'published', 'returned', 'updated') NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    actor_id INT NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    comments TEXT,
    metadata JSON COMMENT 'Additional action metadata (e.g., print_quantity)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_wf_metadata_json CHECK (metadata IS NULL OR JSON_VALID(metadata)),
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_actor (actor_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_workflow_paper_created (exam_paper_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paper Comments/Feedback Table
CREATE TABLE paper_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_type ENUM('feedback', 'revision_request', 'hod_approval_note', 
                     'dean_note', 'print_instruction', 'general') DEFAULT 'general',
    comment TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    parent_comment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_comment_id) REFERENCES paper_comments(id) ON DELETE CASCADE,
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_user (user_id),
    INDEX idx_type (comment_type),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('paper_submitted', 'paper_approved', 'paper_rejected', 'paper_returned',
              'permission_granted', 'approval_required', 'ready_for_print', 
              'print_completed', 'comment_added', 'deadline_reminder', 'general') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_paper_id INT,
    related_entity_type VARCHAR(50),
    related_entity_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    action_url VARCHAR(500),
    metadata JSON,
    archived_at TIMESTAMP NULL COMMENT 'For soft archiving old notifications',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    CONSTRAINT chk_notif_metadata_json CHECK (metadata IS NULL OR JSON_VALID(metadata)),
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_related_paper (related_paper_id),
    INDEX idx_notifications_user_read (user_id, is_read, created_at),
    INDEX idx_archived (archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AUDIT & LOGGING
-- =====================================================

-- Audit Logs Table (System-wide audit trail)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_old_values_json CHECK (old_values IS NULL OR JSON_VALID(old_values)),
    CONSTRAINT chk_new_values_json CHECK (new_values IS NULL OR JSON_VALID(new_values)),
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Papers awaiting HOD approval
CREATE VIEW hod_pending_approvals AS
SELECT 
    ep.id,
    ep.paper_code,
    ep.status,
    ep.exam_type,
    c.code as course_code,
    c.title as course_name,
    CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
    ep.submitted_at,
    ep.hod_id,
    d.name as department_name,
    GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes
FROM exam_papers ep
JOIN courses c ON ep.course_id = c.id
JOIN users u ON ep.created_by = u.id
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
LEFT JOIN programmes p ON epp.programme_id = p.id
WHERE ep.status IN ('submitted', 'hod_review')
  AND ep.deleted_at IS NULL
GROUP BY ep.id, ep.paper_code, ep.status, ep.exam_type, c.code, c.title, 
         u.first_name, u.last_name, ep.submitted_at, ep.hod_id, d.name;

-- View: Papers ready for printing (Exam Master view)
CREATE VIEW papers_ready_for_print AS
SELECT 
    ep.id,
    ep.paper_code,
    ep.status,
    ep.exam_type,
    ep.exam_date,
    c.code as course_code,
    c.title as course_name,
    ep.total_marks,
    ep.duration,
    ep.hod_approved_at,
    ep.print_quantity,
    d.name as department_name,
    col.name as college_name,
    GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes,
    GROUP_CONCAT(DISTINCT p.name ORDER BY p.code SEPARATOR ' | ') as programme_names
FROM exam_papers ep
JOIN courses c ON ep.course_id = c.id
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN colleges col ON c.college_id = col.id
LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
LEFT JOIN programmes p ON epp.programme_id = p.id
WHERE ep.status IN ('ready_for_print', 'printing')
  AND ep.deleted_at IS NULL
GROUP BY ep.id, ep.paper_code, ep.status, ep.exam_type, ep.exam_date,
         c.code, c.title, ep.total_marks, ep.duration, ep.hod_approved_at,
         ep.print_quantity, d.name, col.name;

-- View: Hierarchical Paper Questions
CREATE VIEW vw_paper_questions_hierarchy AS
SELECT 
    epq.*,
    q.question_text,
    q.question_type,
    q.difficulty_level,
    q.bloom_taxonomy,
    q.options,
    c.code as course_code,
    c.title as course_title,
    su.name as study_unit_title,
    CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
    CONCAT(
        'Q', epq.question_number,
        CASE 
            WHEN epq.sub_question_label IS NOT NULL 
            THEN CONCAT('(', epq.sub_question_label, ')')
            ELSE ''
        END
    ) as full_question_number
FROM exam_paper_questions epq
JOIN questions q ON epq.question_id = q.id
JOIN exam_papers ep ON epq.exam_paper_id = ep.id
JOIN courses c ON ep.course_id = c.id
LEFT JOIN study_units su ON q.study_unit_id = su.id
LEFT JOIN users u ON q.created_by = u.id
WHERE ep.deleted_at IS NULL
  AND q.deleted_at IS NULL
ORDER BY epq.exam_paper_id, epq.section, epq.sequence_order, epq.indentation_level;

-- View: Lecturer permissions summary
CREATE VIEW lecturer_permissions_summary AS
SELECT 
    u.id as lecturer_id,
    CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
    c.code as course_code,
    c.title as course_name,
    lp.can_add_questions,
    lp.can_create_papers,
    lp.granted_at,
    lp.expires_at,
    CONCAT(hod.first_name, ' ', hod.last_name) as granted_by_name
FROM lecturer_permissions lp
JOIN users u ON lp.lecturer_id = u.id
JOIN courses c ON lp.course_id = c.id
JOIN users hod ON lp.granted_by = hod.id
WHERE lp.is_active = TRUE
  AND u.deleted_at IS NULL
  AND c.deleted_at IS NULL;

-- View: Papers summary by status
CREATE VIEW papers_by_status_summary AS
SELECT 
    status,
    exam_type,
    COUNT(*) as count,
    MIN(created_at) as oldest_paper,
    MAX(created_at) as newest_paper
FROM exam_papers
WHERE deleted_at IS NULL
GROUP BY status, exam_type;

-- View: Active programmes with course counts
CREATE VIEW programmes_summary AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.level,
    p.duration_years,
    d.name as department_name,
    col.name as college_name,
    COUNT(DISTINCT epp.exam_paper_id) as total_exam_papers,
    p.is_active
FROM programmes p
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN colleges col ON p.college_id = col.id
LEFT JOIN exam_paper_programmes epp ON p.id = epp.programme_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.code, p.name, p.level, p.duration_years, 
         d.name, col.name, p.is_active;

-- View: Papers by programme and status
CREATE VIEW papers_by_programme AS
SELECT 
    p.code as programme_code,
    p.name as programme_name,
    ep.status,
    ep.exam_type,
    ep.academic_year,
    ep.semester,
    c.code as course_code,
    c.title as course_title,
    ep.paper_code,
    ep.exam_date,
    CONCAT(u.first_name, ' ', u.last_name) as created_by_name
FROM programmes p
JOIN exam_paper_programmes epp ON p.id = epp.programme_id
JOIN exam_papers ep ON epp.exam_paper_id = ep.id
JOIN courses c ON ep.course_id = c.id
JOIN users u ON ep.created_by = u.id
WHERE p.deleted_at IS NULL
  AND ep.deleted_at IS NULL
ORDER BY p.code, ep.academic_year DESC, ep.semester DESC;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- -----------------------------------------------------
-- Validate JSON for option_order
-- -----------------------------------------------------
CREATE TRIGGER validate_option_order_json_insert
BEFORE INSERT ON exam_paper_questions
FOR EACH ROW
BEGIN
    IF NEW.option_order IS NOT NULL
       AND JSON_VALID(NEW.option_order) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid JSON in option_order';
    END IF;
END//

CREATE TRIGGER validate_option_order_json_update
BEFORE UPDATE ON exam_paper_questions
FOR EACH ROW
BEGIN
    IF NEW.option_order IS NOT NULL
       AND JSON_VALID(NEW.option_order) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid JSON in option_order';
    END IF;
END//

-- -----------------------------------------------------
-- Prevent sub-questions when parent disallows them
-- -----------------------------------------------------
CREATE TRIGGER prevent_subquestions_when_disabled
BEFORE INSERT ON exam_paper_questions
FOR EACH ROW
BEGIN
    DECLARE parent_allows_subs BOOLEAN;

    IF NEW.parent_question_id IS NOT NULL THEN
        SELECT can_have_sub_questions
        INTO parent_allows_subs
        FROM exam_paper_questions
        WHERE id = NEW.parent_question_id;

        IF parent_allows_subs = FALSE THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Cannot add sub-question: parent does not allow sub-questions';
        END IF;
    END IF;
END//

-- -----------------------------------------------------
-- Recalculate paper total marks (INSERT)
-- -----------------------------------------------------
CREATE TRIGGER update_paper_total_marks_after_insert
AFTER INSERT ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE exam_papers
    SET total_marks = (
        SELECT COALESCE(SUM(marks), 0)
        FROM exam_paper_questions
        WHERE exam_paper_id = NEW.exam_paper_id
    )
    WHERE id = NEW.exam_paper_id;
END//

-- -----------------------------------------------------
-- Recalculate paper total marks (UPDATE)
-- -----------------------------------------------------
CREATE TRIGGER update_paper_total_marks_after_update
AFTER UPDATE ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE exam_papers
    SET total_marks = (
        SELECT COALESCE(SUM(marks), 0)
        FROM exam_paper_questions
        WHERE exam_paper_id = NEW.exam_paper_id
    )
    WHERE id = NEW.exam_paper_id;
END//

-- -----------------------------------------------------
-- Recalculate paper total marks (DELETE)
-- -----------------------------------------------------
CREATE TRIGGER update_paper_total_marks_after_delete
AFTER DELETE ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE exam_papers
    SET total_marks = (
        SELECT COALESCE(SUM(marks), 0)
        FROM exam_paper_questions
        WHERE exam_paper_id = OLD.exam_paper_id
    )
    WHERE id = OLD.exam_paper_id;
END//

-- -----------------------------------------------------
-- Increment question usage count
-- -----------------------------------------------------
CREATE TRIGGER increment_question_usage
AFTER INSERT ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE questions
    SET usage_count = usage_count + 1
    WHERE id = NEW.question_id;
END//

-- -----------------------------------------------------
-- Decrement question usage count
-- -----------------------------------------------------
CREATE TRIGGER decrement_question_usage
AFTER DELETE ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE questions
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.question_id;
END//

DELIMITER ;


-- =====================================================
-- SUB-QUESTIONS FEATURE DOCUMENTATION
-- =====================================================

/*
SUB-QUESTIONS FEATURE - ENHANCED:

The exam_paper_questions table now supports hierarchical questions with:
✅ Unlimited nesting levels
✅ User-controlled sub-question permission via can_have_sub_questions
✅ Automatic cascade deletion of children when parent is deleted
✅ Database-enforced constraint preventing sub-questions when disabled

STRUCTURE:
- Main Question (indentation_level = 0, can_have_sub_questions = TRUE)
  - Sub-question (a) (indentation_level = 1)
  - Sub-question (b) (indentation_level = 1, can_have_sub_questions = TRUE)
    - Sub-sub-question (i) (indentation_level = 2)
    - Sub-sub-question (ii) (indentation_level = 2)
  - Sub-question (c) (indentation_level = 1, can_have_sub_questions = FALSE)
    - ❌ Cannot add sub-questions here

EXAMPLE:
1. Explain database normalization (15 marks) [can_have_sub_questions = TRUE]
   a) Define 1NF (3 marks) [can_have_sub_questions = FALSE]
   b) Define 2NF (4 marks) [can_have_sub_questions = TRUE]
      i) Give an example (2 marks)
      ii) Explain benefits (2 marks)
   c) Define 3NF (4 marks) [can_have_sub_questions = FALSE]

KEY FIELDS:
- parent_question_id: Links to parent (NULL for main questions)
- sub_question_label: 'a', 'b', 'c' or 'i', 'ii', 'iii'
- display_number: Full format like "1", "1(a)", "1(a)(i)"
- indentation_level: 0 (main), 1 (sub), 2 (sub-sub), etc.
- sequence_order: Order within same parent
- sub_marks: Mark distribution like "2+3+5"
- can_have_sub_questions: User-controlled flag (enforced by trigger)

CASCADE DELETE:
When a parent question is deleted, all its children are automatically removed.

DATABASE ENFORCEMENT:
The trigger 'prevent_subquestions_when_disabled' will throw an error if you try
to add a sub-question to a parent that has can_have_sub_questions = FALSE.

API USAGE:
POST /api/exam-papers/[paperId]/questions
{
  "question_id": 123,
  "marks": 5,
  "section": "A",
  "parent_question_id": 456,  // For sub-questions
  "can_have_sub_questions": true  // Optional, defaults to true
}

AUTO-NUMBERING:
The system automatically generates:
- question_number: Main question number
- sub_question_label: Auto-generated (a, b, c or i, ii, iii)
- display_number: Combined display format
*/

-- =====================================================
-- ROLE-BASED DOCUMENTATION
-- =====================================================

/*
ROLE DEFINITIONS:

1. LECTURER
   - Creates exam papers
   - Can add questions WITH PERMISSION from HOD
   - Submits papers for HOD approval
   - Views their own papers and feedback
   - Can create paper versions (drafts)

2. HOD (Head of Department)
   - Creates courses and study units
   - Creates questions for study units
   - Grants permission to specific lecturers to add questions
   - Approves ALL exams (both CATs and FINALS)
   - Reviews and provides feedback on papers
   - Can reject papers with feedback

3. DEAN
   - Oversees college-level approvals
   - Can review papers across departments in their college
   - Provides high-level oversight
   - Optional approval layer for FINAL exams

4. EXAM MASTER
   - Views all HOD-approved papers
   - Handles printing of approved exams
   - Tracks printing status and quantities
   - Manages exam distribution
   - Updates print quantities and status

5. ADMIN
   - Full system access
   - Administrative support
   - User management
   - System configuration
   - Can perform actions on behalf of other roles
   - Manages soft-deleted records

WORKFLOW:
1. Lecturer creates paper → status: 'draft'
2. Lecturer adds questions and sub-questions
3. Lecturer submits paper → status: 'submitted' (triggers notification to HOD)
4. HOD reviews → status: 'hod_review'
5. HOD approves → status: 'hod_approved' → status: 'ready_for_print'
6. Exam Master receives notification
7. Exam Master starts printing → status: 'printing'
8. Printing complete → status: 'printed'
9. Paper published → status: 'published'

ALTERNATIVE PATHS:
- HOD rejects → status: 'hod_rejected' → Lecturer notified → back to draft
- Dean can oversee and provide feedback at any stage
- Version history maintained for all significant changes

SOFT DELETE:
- Records are marked as deleted (deleted_at, deleted_by) not removed
- Admin can view and restore deleted records
- Prevents CASCADE issues with historical data
*/

-- =====================================================
-- INDEXES FOR PERFORMANCE - ENHANCED
-- =====================================================

/*
KEY INDEXES ADDED:

1. SOFT DELETE SUPPORT:
   - idx_deleted on all major tables
   - Enables fast filtering of active vs deleted records

2. SUB-QUESTIONS:
   - idx_parent - Fast lookup of children
   - idx_indentation - For filtering by level
   - unique_paper_section_seq - Uses IFNULL to handle NULL parent_id

3. WORKFLOW:
   - idx_papers_creator_date - Fast date-based queries
   - idx_notifications_user_read - Unread notification queries
   - idx_archived - Notification archival queries

4. AUDIT:
   - idx_workflow_paper_created - Paper history queries
   - Multiple composite indexes for common query patterns

QUERY OPTIMIZATION EXAMPLES:

-- Get all active questions for a paper (hierarchical)
SELECT * FROM exam_paper_questions
WHERE exam_paper_id = ?
ORDER BY section, sequence_order, indentation_level;

-- Get only main questions (not deleted)
SELECT * FROM exam_paper_questions epq
JOIN exam_papers ep ON epq.exam_paper_id = ep.id
WHERE epq.exam_paper_id = ? 
  AND epq.parent_question_id IS NULL
  AND ep.deleted_at IS NULL
ORDER BY section, sequence_order;

-- Get children of a question
SELECT * FROM exam_paper_questions
WHERE parent_question_id = ?
ORDER BY sequence_order;

-- Get question hierarchy using view (auto-filters deleted)
SELECT * FROM vw_paper_questions_hierarchy
WHERE exam_paper_id = ?;

-- Get unread notifications for user
SELECT * FROM notifications
WHERE user_id = ?
  AND is_read = FALSE
  AND archived_at IS NULL
ORDER BY created_at DESC;
*/

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure: Clean up old expired sessions
CREATE PROCEDURE cleanup_old_sessions()
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END//

-- Procedure: Archive old read notifications (90+ days)
CREATE PROCEDURE archive_old_notifications()
BEGIN
    UPDATE notifications
    SET archived_at = NOW()
    WHERE is_read = TRUE
      AND archived_at IS NULL
      AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END//

-- Procedure: Get paper with full details
CREATE PROCEDURE get_paper_full_details(IN paper_id INT)
BEGIN
    SELECT 
        ep.*,
        c.code as course_code,
        c.title as course_title,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        CONCAT(hod.first_name, ' ', hod.last_name) as hod_name,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes
    FROM exam_papers ep
    JOIN courses c ON ep.course_id = c.id
    JOIN users creator ON ep.created_by = creator.id
    LEFT JOIN users hod ON ep.hod_id = hod.id
    LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
    LEFT JOIN programmes p ON epp.programme_id = p.id
    WHERE ep.id = paper_id
      AND ep.deleted_at IS NULL
    GROUP BY ep.id;
END//

DELIMITER ;

-- =====================================================
-- SCHEDULED EVENTS (Optional - requires event scheduler)
-- =====================================================

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Event: Daily cleanup of expired sessions
CREATE EVENT IF NOT EXISTS daily_session_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL cleanup_old_sessions();

-- Event: Weekly notification archival
CREATE EVENT IF NOT EXISTS weekly_notification_archive
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
    CALL archive_old_notifications();

-- =====================================================
-- END OF SCHEMA
-- =====================================================