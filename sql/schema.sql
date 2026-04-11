-- ============================================================
--  UEMS-PHD-VV — University Examination Management System
--              & PhD Viva Voce Administration
--
--  The UEMS is done now i want to intergrate the viva voce administration module into the same database, so i will add tables for phd candidates, thesis submissions, 
--  viva scheduling, examiner assignments, evaluations and recommendations. 
-- This way we can manage the entire examination lifecycle from course exams to PhD defenses in one unified system.
--

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
--  SECTION 1 — ORGANISATIONAL STRUCTURE
-- ============================================================

-- Colleges / Schools  (e.g. SOMAC, SONAS, CEM, SOL)
CREATE TABLE colleges (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    deleted_at  TIMESTAMP    NULL,
    deleted_by  INT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code    (code),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Departments  (e.g. CS, IT, Statistics — nested under a College)
CREATE TABLE departments (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    college_id  INT          NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    deleted_at  TIMESTAMP    NULL,
    deleted_by  INT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    INDEX idx_code    (code),
    INDEX idx_college (college_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Programmes  (e.g. BIT, DIT, BSTAT, MBA, PhD CS)
CREATE TABLE programmes (
    id             INT          AUTO_INCREMENT PRIMARY KEY,
    code           VARCHAR(50)  NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL UNIQUE,
    level          ENUM('certificate','diploma','bachelors','masters','phd') NOT NULL,
    duration_years INT,
    department_id  INT,
    college_id     INT,
    description    TEXT,
    is_active      BOOLEAN      DEFAULT TRUE,
    deleted_at     TIMESTAMP    NULL,
    deleted_by     INT,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (college_id)   REFERENCES colleges(id)    ON DELETE SET NULL,
    INDEX idx_code         (code),
    INDEX idx_department   (department_id),
    INDEX idx_college      (college_id),
    INDEX idx_level        (level),
    INDEX idx_active       (is_active),
    INDEX idx_deleted      (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 2 — USER MANAGEMENT & AUTHENTICATION
-- ============================================================

-- Users  (all roles share one table — RBAC via role column)
CREATE TABLE users (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          ENUM('lecturer','hod','dean','exam_master',
                       'viva_coordinator','admin') NOT NULL DEFAULT 'lecturer',
    department_id INT,
    college_id    INT,
    phone         VARCHAR(20),
    is_active     BOOLEAN      DEFAULT TRUE,
    last_login    TIMESTAMP    NULL,
    deleted_at    TIMESTAMP    NULL,
    deleted_by    INT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (college_id)   REFERENCES colleges(id)    ON DELETE SET NULL,
    INDEX idx_email      (email),
    INDEX idx_role       (role),
    INDEX idx_department (department_id),
    INDEX idx_deleted    (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Sessions  (PHP session token tracking)
CREATE TABLE sessions (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id    INT          NOT NULL,
    expires_at DATETIME     NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id  (session_id),
    INDEX idx_expires_at  (expires_at),
    INDEX idx_user_expire (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 3 — ACADEMIC CONTENT
-- ============================================================

-- Courses
CREATE TABLE courses (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(50)  NOT NULL UNIQUE,
    title         VARCHAR(255) NOT NULL,
    level         INT          COMMENT 'Year of study (1, 2, 3 …)',
    semester      INT,
    credit_units  INT,
    college_id    INT,
    department_id INT,
    hod_id        INT          COMMENT 'HOD who manages this course',
    description   TEXT,
    is_active     BOOLEAN      DEFAULT TRUE,
    deleted_at    TIMESTAMP    NULL,
    deleted_by    INT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (college_id)   REFERENCES colleges(id)    ON DELETE RESTRICT,
    FOREIGN KEY (hod_id)       REFERENCES users(id)       ON DELETE SET NULL,
    INDEX idx_code       (code),
    INDEX idx_department (department_id),
    INDEX idx_hod        (hod_id),
    INDEX idx_deleted    (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Study Units  (topics / modules inside a Course, created by HOD)
CREATE TABLE study_units (
    id                INT          AUTO_INCREMENT PRIMARY KEY,
    course_id         INT          NOT NULL,
    code              VARCHAR(50)  NOT NULL,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    sequence_order    INT          DEFAULT 0,
    learning_outcomes TEXT,
    created_by        INT          NULL COMMENT 'HOD who created this unit',
    is_active         BOOLEAN      DEFAULT TRUE,
    deleted_at        TIMESTAMP    NULL,
    deleted_by        INT,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE RESTRICT,
    UNIQUE KEY unique_course_unit (course_id, code),
    INDEX idx_course     (course_id),
    INDEX idx_created_by (created_by),
    INDEX idx_deleted    (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 4 — QUESTION BANK
-- ============================================================

CREATE TABLE questions (
    id               INT          AUTO_INCREMENT PRIMARY KEY,
    course_id        INT          NOT NULL,
    study_unit_id    INT,
    created_by       INT          NOT NULL COMMENT 'HOD or permitted Lecturer',
    question_type    ENUM('multiple_choice','true_false','short_answer',
                          'essay','practical','case_study') NOT NULL,
    difficulty_level ENUM('easy','medium','hard') DEFAULT 'medium',
    question_text    TEXT         NOT NULL,
    options          JSON         COMMENT 'MCQ options array',
    correct_answer   TEXT,
    marks            INT          NOT NULL DEFAULT 1,
    time_allocation  INT          COMMENT 'Suggested time in minutes',
    learning_outcome TEXT          COMMENT 'Learning outcome Described in the question',
    keywords         JSON          COMMENT 'Array of keywords for search',
    bloom_taxonomy   ENUM('remember','understand','apply',
                          'analyze','evaluate','create'),
    tags             JSON,
    usage_count      INT          DEFAULT 0,
    is_active        BOOLEAN      DEFAULT TRUE,
    approved_by      INT          COMMENT 'HOD who approved this question',
    approved_at      TIMESTAMP    NULL,
    deleted_at       TIMESTAMP    NULL,
    deleted_by       INT,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)     REFERENCES courses(id)     ON DELETE RESTRICT,
    FOREIGN KEY (study_unit_id) REFERENCES study_units(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by)    REFERENCES users(id)       ON DELETE RESTRICT,
    FOREIGN KEY (approved_by)   REFERENCES users(id)       ON DELETE SET NULL,
    -- JSON validation handled here by CHECK constraints (no trigger needed)
    CONSTRAINT chk_options_json CHECK (options IS NULL OR JSON_VALID(options)),
    CONSTRAINT chk_tags_json    CHECK (tags    IS NULL OR JSON_VALID(tags)),
    INDEX idx_course      (course_id),
    INDEX idx_study_unit  (study_unit_id),
    INDEX idx_created_by  (created_by),
    INDEX idx_type        (question_type),
    INDEX idx_difficulty  (difficulty_level),
    INDEX idx_approved_by (approved_by),
    INDEX idx_deleted     (deleted_at),
    FULLTEXT idx_question_text (question_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 5 — EXAM PAPERS
-- ============================================================

CREATE TABLE exam_papers (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    paper_code      VARCHAR(50)  NOT NULL UNIQUE,
    course_id       INT          NOT NULL,
    created_by      INT          NOT NULL COMMENT 'Lecturer who created the paper',
    -- Exam details
    exam_type       ENUM('TEST','CAT','FINAL') NOT NULL,
    academic_year   INT          NOT NULL,
    semester        INT          NOT NULL,
    exam_date       DATE,
    duration        INT          COMMENT 'Duration in minutes',
    total_marks     INT          DEFAULT 0,
    -- Display / print content
    instructions    TEXT         COMMENT 'Shown at top of printed paper',
    footer_text     VARCHAR(255) DEFAULT NULL
                        COMMENT 'Defaults to *** END OF EXAMINATION *** when NULL',
    -- Workflow status
    status          ENUM(
                        'draft','submitted','hod_review','hod_approved','hod_rejected',
                        'dean_review','dean_approved','dean_rejected',
                        'ready_for_print','printing','printed','published'
                    ) DEFAULT 'draft',
    -- Approval tracking
    hod_id          INT          COMMENT 'HOD responsible for approval',
    hod_approved_at TIMESTAMP    NULL,
    dean_id         INT,
    dean_approved_at TIMESTAMP   NULL,
    exam_master_id  INT,
    printed_at      TIMESTAMP    NULL,
    print_quantity  INT          DEFAULT 0,
    -- Timestamps
    submitted_at    TIMESTAMP    NULL,
    published_at    TIMESTAMP    NULL,
    -- Version control
    version         INT          DEFAULT 1,
    is_locked       BOOLEAN      DEFAULT FALSE,
    -- Soft delete
    deleted_at      TIMESTAMP    NULL,
    deleted_by      INT,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)      REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by)     REFERENCES users(id)   ON DELETE RESTRICT,
    FOREIGN KEY (hod_id)         REFERENCES users(id)   ON DELETE SET NULL,
    FOREIGN KEY (dean_id)        REFERENCES users(id)   ON DELETE SET NULL,
    FOREIGN KEY (exam_master_id) REFERENCES users(id)   ON DELETE SET NULL,
    INDEX idx_paper_code          (paper_code),
    INDEX idx_course              (course_id),
    INDEX idx_created_by          (created_by),
    INDEX idx_status              (status),
    INDEX idx_exam_type           (exam_type),
    INDEX idx_hod                 (hod_id),
    INDEX idx_academic_year       (academic_year, semester),
    INDEX idx_papers_status_type  (status, exam_type),
    INDEX idx_papers_creator_stat (created_by, status),
    INDEX idx_deleted             (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Exam Paper Versions  (full snapshots for version history)
CREATE TABLE exam_paper_versions (
    id              INT  AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id   INT  NOT NULL,
    version_number  INT  NOT NULL,
    snapshot        JSON NOT NULL COMMENT 'Complete paper state at this version',
    changes_summary TEXT,
    created_by      INT  NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by)    REFERENCES users(id)       ON DELETE RESTRICT,
    UNIQUE KEY unique_paper_version (exam_paper_id, version_number),
    INDEX idx_exam_paper (exam_paper_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Exam Paper ↔ Programmes  (many-to-many)
CREATE TABLE exam_paper_programmes (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT NOT NULL,
    programme_id  INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id)  ON DELETE CASCADE,
    FOREIGN KEY (programme_id)  REFERENCES programmes(id)   ON DELETE CASCADE,
    UNIQUE KEY unique_paper_programme (exam_paper_id, programme_id),
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_programme  (programme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 6 — EXAM PAPER QUESTIONS (with Sub-Question support)
-- ============================================================

CREATE TABLE exam_paper_questions (
    id                    INT          AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id         INT          NOT NULL,
    question_id           INT          NOT NULL,
    section               VARCHAR(10)  DEFAULT 'A',
    question_number       VARCHAR(20)  NOT NULL,
    sub_question_label    VARCHAR(20)  COMMENT 'a, b, c … or i, ii, iii …',
    display_number        VARCHAR(50)  COMMENT 'Full label e.g. 1(a)(i)',
    marks                 INT          NOT NULL,
    sub_marks             VARCHAR(50)  COMMENT 'Mark split e.g. 2+3+5',
    is_required           BOOLEAN      DEFAULT TRUE,
    is_choice             BOOLEAN      DEFAULT FALSE,
    choice_group          VARCHAR(20),
    choice_instructions   VARCHAR(255) COMMENT 'e.g. Answer any 2 of 3',
    sequence_order        INT          NOT NULL,
    parent_question_id    INT          COMMENT 'NULL = top-level question',
    -- Generated column so NULL parents can participate in the UNIQUE key
    parent_question_key   INT          GENERATED ALWAYS AS (IFNULL(parent_question_id, 0)) STORED,
    indentation_level     INT          DEFAULT 0,
    can_have_sub_questions BOOLEAN     DEFAULT TRUE,
    custom_instructions   TEXT,
    notes                 TEXT,
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_epq_exam_paper
        FOREIGN KEY (exam_paper_id)      REFERENCES exam_papers(id)          ON DELETE CASCADE,
    CONSTRAINT fk_epq_question
        FOREIGN KEY (question_id)        REFERENCES questions(id)            ON DELETE RESTRICT,
    CONSTRAINT fk_epq_parent
        FOREIGN KEY (parent_question_id) REFERENCES exam_paper_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_paper_section_seq (exam_paper_id, section, sequence_order, parent_question_key),
    UNIQUE KEY unique_question_per_parent (exam_paper_id, question_id, parent_question_key),
    INDEX idx_exam_paper      (exam_paper_id),
    INDEX idx_question        (question_id),
    INDEX idx_parent          (parent_question_id),
    INDEX idx_section         (section),
    INDEX idx_indentation     (indentation_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 7 — PERMISSIONS SYSTEM
-- ============================================================

-- HOD grants lecturers permission to add questions / create papers
CREATE TABLE lecturer_permissions (
    id                INT       AUTO_INCREMENT PRIMARY KEY,
    lecturer_id       INT       NOT NULL,
    course_id         INT       NOT NULL,
    granted_by        INT       NOT NULL COMMENT 'HOD who granted the permission',
    can_add_questions BOOLEAN   DEFAULT TRUE,
    can_create_papers BOOLEAN   DEFAULT TRUE,
    can_edit_questions BOOLEAN  DEFAULT FALSE,
    granted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at        TIMESTAMP NULL,
    is_active         BOOLEAN   DEFAULT TRUE,
    notes             TEXT,
    FOREIGN KEY (lecturer_id) REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (course_id)   REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by)  REFERENCES users(id)   ON DELETE RESTRICT,
    UNIQUE KEY unique_lecturer_course (lecturer_id, course_id),
    INDEX idx_lecturer   (lecturer_id),
    INDEX idx_course     (course_id),
    INDEX idx_granted_by (granted_by),
    INDEX idx_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 8 — WORKFLOW & APPROVALS
-- ============================================================

-- Full audit trail of every paper status transition
CREATE TABLE workflow_history (
    id            INT  AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id INT  NOT NULL,
    action        ENUM('created','submitted','hod_approved','hod_rejected',
                       'dean_approved','dean_rejected','ready_for_print',
                       'printing_started','printed','published',
                       'returned','updated') NOT NULL,
    from_status   VARCHAR(50),
    to_status     VARCHAR(50) NOT NULL,
    actor_id      INT         NOT NULL,
    actor_role    VARCHAR(50) NOT NULL,
    comments      TEXT,
    metadata      JSON,
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id)      REFERENCES users(id)       ON DELETE RESTRICT,
    CONSTRAINT chk_wf_metadata CHECK (metadata IS NULL OR JSON_VALID(metadata)),
    INDEX idx_exam_paper           (exam_paper_id),
    INDEX idx_actor                (actor_id),
    INDEX idx_action               (action),
    INDEX idx_workflow_paper_date  (exam_paper_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Comments / feedback attached to a paper
CREATE TABLE paper_comments (
    id                INT  AUTO_INCREMENT PRIMARY KEY,
    exam_paper_id     INT  NOT NULL,
    user_id           INT  NOT NULL,
    comment_type      ENUM('feedback','revision_request','hod_approval_note',
                           'dean_note','print_instruction','general') DEFAULT 'general',
    comment           TEXT NOT NULL,
    is_resolved       BOOLEAN   DEFAULT FALSE,
    parent_comment_id INT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_paper_id)     REFERENCES exam_papers(id)    ON DELETE CASCADE,
    FOREIGN KEY (user_id)           REFERENCES users(id)          ON DELETE RESTRICT,
    FOREIGN KEY (parent_comment_id) REFERENCES paper_comments(id) ON DELETE CASCADE,
    INDEX idx_exam_paper (exam_paper_id),
    INDEX idx_user       (user_id),
    INDEX idx_resolved   (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 9 — NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id                  INT          AUTO_INCREMENT PRIMARY KEY,
    user_id             INT          NOT NULL,
    type                ENUM('paper_submitted','paper_approved','paper_rejected',
                             'paper_returned','permission_granted','approval_required',
                             'ready_for_print','print_completed','comment_added',
                             'viva_scheduled','viva_reminder','viva_result',
                             'thesis_uploaded','examiner_assigned','general') NOT NULL,
    title               VARCHAR(255) NOT NULL,
    message             TEXT         NOT NULL,
    related_paper_id    INT,
    related_entity_type VARCHAR(50),
    related_entity_id   INT,
    is_read             BOOLEAN      DEFAULT FALSE,
    read_at             TIMESTAMP    NULL,
    priority            ENUM('low','medium','high','urgent') DEFAULT 'medium',
    action_url          VARCHAR(500),
    archived_at         TIMESTAMP    NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)          REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (related_paper_id) REFERENCES exam_papers(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read, created_at),
    INDEX idx_archived    (archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 10 — AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   INT,
    old_values  JSON,
    new_values  JSON,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_old_vals CHECK (old_values IS NULL OR JSON_VALID(old_values)),
    CONSTRAINT chk_new_vals CHECK (new_values IS NULL OR JSON_VALID(new_values)),
    INDEX idx_user       (user_id),
    INDEX idx_entity     (entity_type, entity_id),
    INDEX idx_action     (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 11 — PhD VIVA VOCE ADMINISTRATION
-- ============================================================

-- PhD Candidates  (students going through the viva process)
CREATE TABLE phd_candidates (
    id                  INT          AUTO_INCREMENT PRIMARY KEY,
    user_id             INT          NOT NULL COMMENT 'User account of the candidate',
    registration_number VARCHAR(50)  NOT NULL UNIQUE,
    thesis_title        VARCHAR(500) NOT NULL,
    programme_id        INT          NOT NULL,
    supervisor_id       INT          COMMENT 'Primary supervisor (user)',
    co_supervisor_id    INT          COMMENT 'Co-supervisor if any',
    enrolment_year      YEAR,
    status              ENUM('enrolled','thesis_submitted','viva_scheduled',
                             'viva_completed','corrections_pending',
                             'corrections_submitted','awarded','withdrawn') DEFAULT 'enrolled',
    deleted_at          TIMESTAMP    NULL,
    deleted_by          INT,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)         REFERENCES users(id)       ON DELETE RESTRICT,
    FOREIGN KEY (programme_id)    REFERENCES programmes(id)  ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id)   REFERENCES users(id)       ON DELETE SET NULL,
    FOREIGN KEY (co_supervisor_id) REFERENCES users(id)      ON DELETE SET NULL,
    INDEX idx_user       (user_id),
    INDEX idx_programme  (programme_id),
    INDEX idx_supervisor (supervisor_id),
    INDEX idx_status     (status),
    INDEX idx_deleted    (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Thesis Submissions  (tracks uploaded thesis documents)
CREATE TABLE thesis_submissions (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    candidate_id  INT          NOT NULL,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL COMMENT 'Server path to uploaded PDF',
    file_size_kb  INT,
    version       INT          DEFAULT 1 COMMENT 'Increments on each re-submission',
    submission_notes TEXT,
    submitted_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES phd_candidates(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_id),
    INDEX idx_version   (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Viva Schedules  (the oral defence appointment)
CREATE TABLE viva_schedules (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    candidate_id    INT          NOT NULL,
    thesis_id       INT          NOT NULL COMMENT 'Which thesis version is being defended',
    scheduled_date  DATE         NOT NULL,
    scheduled_time  TIME         NOT NULL,
    venue           VARCHAR(255) NOT NULL,
    duration_minutes INT         DEFAULT 90,
    status          ENUM('scheduled','postponed','cancelled',
                         'in_progress','completed') DEFAULT 'scheduled',
    postponement_reason TEXT,
    created_by      INT          NOT NULL COMMENT 'Viva Coordinator who scheduled it',
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES phd_candidates(id)   ON DELETE RESTRICT,
    FOREIGN KEY (thesis_id)    REFERENCES thesis_submissions(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by)   REFERENCES users(id)             ON DELETE RESTRICT,
    INDEX idx_candidate     (candidate_id),
    INDEX idx_date          (scheduled_date),
    INDEX idx_status        (status),
    INDEX idx_created_by    (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Viva Examiners  (who is on the panel for a given viva)
CREATE TABLE viva_examiners (
    id            INT  AUTO_INCREMENT PRIMARY KEY,
    viva_id       INT  NOT NULL,
    examiner_id   INT  NOT NULL COMMENT 'User with examiner access',
    role          ENUM('chairperson','internal_examiner',
                       'external_examiner') NOT NULL,
    confirmed     BOOLEAN   DEFAULT FALSE,
    confirmed_at  TIMESTAMP NULL,
    notified_at   TIMESTAMP NULL,
    FOREIGN KEY (viva_id)     REFERENCES viva_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (examiner_id) REFERENCES users(id)          ON DELETE RESTRICT,
    UNIQUE KEY unique_viva_examiner (viva_id, examiner_id),
    INDEX idx_viva     (viva_id),
    INDEX idx_examiner (examiner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Viva Evaluations  (individual examiner score submissions)
CREATE TABLE viva_evaluations (
    id                   INT  AUTO_INCREMENT PRIMARY KEY,
    viva_id              INT  NOT NULL,
    examiner_id          INT  NOT NULL,
    -- Scoring criteria (each out of 25, total = 100)
    originality_score    TINYINT UNSIGNED COMMENT 'Out of 25',
    methodology_score    TINYINT UNSIGNED COMMENT 'Out of 25',
    presentation_score   TINYINT UNSIGNED COMMENT 'Out of 25',
    literature_score     TINYINT UNSIGNED COMMENT 'Out of 25',
    overall_score        TINYINT UNSIGNED GENERATED ALWAYS AS (
                             COALESCE(originality_score,0)  +
                             COALESCE(methodology_score,0)  +
                             COALESCE(presentation_score,0) +
                             COALESCE(literature_score,0)
                         ) STORED COMMENT 'Auto-calculated total out of 100',
    strengths            TEXT,
    weaknesses           TEXT,
    recommended_corrections TEXT,
    general_comments     TEXT,
    submitted_at         TIMESTAMP NULL COMMENT 'NULL until examiner submits',
    is_submitted         BOOLEAN   DEFAULT FALSE,
    FOREIGN KEY (viva_id)     REFERENCES viva_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (examiner_id) REFERENCES users(id)          ON DELETE RESTRICT,
    UNIQUE KEY unique_evaluation (viva_id, examiner_id),
    CONSTRAINT chk_originality   CHECK (originality_score   BETWEEN 0 AND 25),
    CONSTRAINT chk_methodology   CHECK (methodology_score   BETWEEN 0 AND 25),
    CONSTRAINT chk_presentation  CHECK (presentation_score  BETWEEN 0 AND 25),
    CONSTRAINT chk_literature    CHECK (literature_score    BETWEEN 0 AND 25),
    INDEX idx_viva     (viva_id),
    INDEX idx_examiner (examiner_id),
    INDEX idx_submitted (is_submitted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Viva Recommendations  (final panel decision after all evaluations)
CREATE TABLE viva_recommendations (
    id              INT  AUTO_INCREMENT PRIMARY KEY,
    viva_id         INT  NOT NULL UNIQUE COMMENT 'One recommendation per viva',
    outcome         ENUM('pass','pass_with_minor_corrections',
                         'pass_with_major_corrections','fail') NOT NULL,
    correction_deadline DATE COMMENT 'Deadline for submitting corrections',
    final_comments  TEXT,
    issued_by       INT  NOT NULL COMMENT 'Viva Coordinator who issued the recommendation',
    issued_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (viva_id)   REFERENCES viva_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id)          ON DELETE RESTRICT,
    INDEX idx_viva    (viva_id),
    INDEX idx_outcome (outcome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  SECTION 12 — VIEWS
-- ============================================================

-- Papers awaiting HOD approval
CREATE VIEW hod_pending_approvals AS
SELECT
    ep.id,
    ep.paper_code,
    ep.status,
    ep.exam_type,
    c.code  AS course_code,
    c.title AS course_name,
    CONCAT(u.first_name, ' ', u.last_name) AS lecturer_name,
    ep.submitted_at,
    ep.hod_id,
    d.name  AS department_name,
    GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') AS programmes
FROM exam_papers ep
JOIN  courses     c   ON ep.course_id   = c.id
JOIN  users       u   ON ep.created_by  = u.id
LEFT JOIN departments d   ON c.department_id = d.id
LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
LEFT JOIN programmes  p   ON epp.programme_id = p.id
WHERE ep.status IN ('submitted','hod_review')
  AND ep.deleted_at IS NULL
GROUP BY ep.id, ep.paper_code, ep.status, ep.exam_type,
         c.code, c.title, u.first_name, u.last_name,
         ep.submitted_at, ep.hod_id, d.name;


-- Papers ready for printing (Exam Master view)
CREATE VIEW papers_ready_for_print AS
SELECT
    ep.id,
    ep.paper_code,
    ep.status,
    ep.exam_type,
    ep.exam_date,
    c.code  AS course_code,
    c.title AS course_name,
    ep.total_marks,
    ep.duration,
    ep.hod_approved_at,
    ep.print_quantity,
    d.name   AS department_name,
    col.name AS college_name,
    GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') AS programmes
FROM exam_papers ep
JOIN  courses     c   ON ep.course_id      = c.id
LEFT JOIN departments d   ON c.department_id   = d.id
LEFT JOIN colleges    col ON c.college_id       = col.id
LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
LEFT JOIN programmes  p   ON epp.programme_id  = p.id
WHERE ep.status IN ('ready_for_print','printing')
  AND ep.deleted_at IS NULL
GROUP BY ep.id, ep.paper_code, ep.status, ep.exam_type, ep.exam_date,
         c.code, c.title, ep.total_marks, ep.duration,
         ep.hod_approved_at, ep.print_quantity, d.name, col.name;


-- Hierarchical paper questions (flattened with context)
CREATE VIEW vw_paper_questions_hierarchy AS
SELECT
    epq.*,
    q.question_text,
    q.question_type,
    q.difficulty_level,
    q.bloom_taxonomy,
    q.options,
    c.code  AS course_code,
    c.title AS course_title,
    su.name AS study_unit_title,
    CONCAT(u.first_name, ' ', u.last_name) AS question_author,
    CONCAT(
        'Q', epq.question_number,
        CASE WHEN epq.sub_question_label IS NOT NULL
             THEN CONCAT('(', epq.sub_question_label, ')')
             ELSE ''
        END
    ) AS full_question_label
FROM exam_paper_questions epq
JOIN  questions   q   ON epq.question_id    = q.id
JOIN  exam_papers ep  ON epq.exam_paper_id  = ep.id
JOIN  courses     c   ON ep.course_id       = c.id
LEFT JOIN study_units su ON q.study_unit_id = su.id
LEFT JOIN users       u  ON q.created_by    = u.id
WHERE ep.deleted_at IS NULL
  AND q.deleted_at  IS NULL
ORDER BY epq.exam_paper_id, epq.section, epq.sequence_order, epq.indentation_level;


-- Viva schedule overview (Viva Coordinator dashboard)
CREATE VIEW vw_viva_schedule_overview AS
SELECT
    vs.id                                          AS viva_id,
    vs.scheduled_date,
    vs.scheduled_time,
    vs.venue,
    vs.status                                      AS viva_status,
    pc.registration_number,
    pc.thesis_title,
    pc.status                                      AS candidate_status,
    CONCAT(cu.first_name, ' ', cu.last_name)       AS candidate_name,
    CONCAT(su.first_name, ' ', su.last_name)       AS supervisor_name,
    p.name                                         AS programme_name,
    vr.outcome,
    COUNT(DISTINCT ve.id)                          AS evaluations_submitted,
    COUNT(DISTINCT vi.id)                          AS total_examiners
FROM viva_schedules vs
JOIN  phd_candidates pc ON vs.candidate_id  = pc.id
JOIN  users          cu ON pc.user_id        = cu.id
LEFT JOIN users      su ON pc.supervisor_id  = su.id
JOIN  programmes     p  ON pc.programme_id   = p.id
LEFT JOIN viva_examiners vi ON vs.id = vi.viva_id
LEFT JOIN viva_evaluations ve ON vs.id = ve.viva_id AND ve.is_submitted = TRUE
LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
GROUP BY vs.id, vs.scheduled_date, vs.scheduled_time, vs.venue,
         vs.status, pc.registration_number, pc.thesis_title,
         pc.status, cu.first_name, cu.last_name,
         su.first_name, su.last_name, p.name, vr.outcome;


-- Lecturer permissions summary
CREATE VIEW lecturer_permissions_summary AS
SELECT
    u.id   AS lecturer_id,
    CONCAT(u.first_name,   ' ', u.last_name)   AS lecturer_name,
    c.code AS course_code,
    c.title AS course_name,
    lp.can_add_questions,
    lp.can_create_papers,
    lp.granted_at,
    lp.expires_at,
    CONCAT(hod.first_name, ' ', hod.last_name) AS granted_by_name
FROM lecturer_permissions lp
JOIN users   u   ON lp.lecturer_id = u.id
JOIN courses c   ON lp.course_id   = c.id
JOIN users   hod ON lp.granted_by  = hod.id
WHERE lp.is_active   = TRUE
  AND u.deleted_at   IS NULL
  AND c.deleted_at   IS NULL;


-- ============================================================
--  SECTION 13 — TRIGGERS
-- ============================================================

DELIMITER //

-- NOTE: trg_validate_option_order_insert and
--       trg_validate_option_order_update have been REMOVED.
--       They referenced `NEW.option_order` which does not exist
--       on exam_paper_questions.  JSON validation for `options`
--       on the questions table is already covered by the CHECK
--       constraint chk_options_json in SECTION 4.

-- Block sub-questions when parent has can_have_sub_questions = FALSE
CREATE TRIGGER trg_prevent_subquestions_when_disabled
BEFORE INSERT ON exam_paper_questions
FOR EACH ROW
BEGIN
    DECLARE parent_allows BOOLEAN;
    IF NEW.parent_question_id IS NOT NULL THEN
        SELECT can_have_sub_questions INTO parent_allows
        FROM exam_paper_questions
        WHERE id = NEW.parent_question_id;

        IF parent_allows = FALSE THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Parent question does not allow sub-questions';
        END IF;
    END IF;
END//

-- Recalculate exam paper total marks — after INSERT
CREATE TRIGGER trg_marks_after_insert
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

-- Recalculate exam paper total marks — after UPDATE
CREATE TRIGGER trg_marks_after_update
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

-- Recalculate exam paper total marks — after DELETE
CREATE TRIGGER trg_marks_after_delete
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

-- Increment question usage count when added to a paper
CREATE TRIGGER trg_increment_question_usage
AFTER INSERT ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE questions
    SET usage_count = usage_count + 1
    WHERE id = NEW.question_id;
END//

-- Decrement question usage count when removed from a paper
CREATE TRIGGER trg_decrement_question_usage
AFTER DELETE ON exam_paper_questions
FOR EACH ROW
BEGIN
    UPDATE questions
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.question_id;
END//

-- Update phd_candidates.status when a viva is scheduled
CREATE TRIGGER trg_candidate_status_on_viva_schedule
AFTER INSERT ON viva_schedules
FOR EACH ROW
BEGIN
    UPDATE phd_candidates
    SET status = 'viva_scheduled'
    WHERE id = NEW.candidate_id;
END//

-- Update phd_candidates.status when viva is marked completed
CREATE TRIGGER trg_candidate_status_on_viva_complete
AFTER UPDATE ON viva_schedules
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE phd_candidates
        SET status = 'viva_completed'
        WHERE id = NEW.candidate_id;
    END IF;
END//

-- Increment thesis version number automatically
CREATE TRIGGER trg_thesis_version_increment
BEFORE INSERT ON thesis_submissions
FOR EACH ROW
BEGIN
    DECLARE latest_version INT DEFAULT 0;
    SELECT COALESCE(MAX(version), 0)
    INTO latest_version
    FROM thesis_submissions
    WHERE candidate_id = NEW.candidate_id;
    SET NEW.version = latest_version + 1;
END//

DELIMITER ;


-- ============================================================
--  SECTION 14 — STORED PROCEDURES
-- ============================================================

DELIMITER //

-- Clean up expired PHP sessions
CREATE PROCEDURE cleanup_expired_sessions()
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END//

-- Archive notifications older than 90 days that are already read
CREATE PROCEDURE archive_old_notifications()
BEGIN
    UPDATE notifications
    SET archived_at = NOW()
    WHERE is_read    = TRUE
      AND archived_at IS NULL
      AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END//

-- Full paper detail (used in preview & print)
CREATE PROCEDURE sp_get_paper_full_details(IN p_paper_id INT)
BEGIN
    SELECT
        ep.*,
        c.code  AS course_code,
        c.title AS course_title,
        CONCAT(creator.first_name, ' ', creator.last_name) AS created_by_name,
        CONCAT(hod.first_name,     ' ', hod.last_name)     AS hod_name,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') AS programmes
    FROM exam_papers ep
    JOIN  courses c       ON ep.course_id  = c.id
    JOIN  users   creator ON ep.created_by = creator.id
    LEFT JOIN users hod   ON ep.hod_id     = hod.id
    LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
    LEFT JOIN programmes p ON epp.programme_id = p.id
    WHERE ep.id         = p_paper_id
      AND ep.deleted_at IS NULL
    GROUP BY ep.id;
END//

-- Full viva report (used in viva outcome page)
CREATE PROCEDURE sp_get_viva_report(IN p_viva_id INT)
BEGIN
    -- Schedule & candidate info
    SELECT
        vs.*,
        pc.registration_number,
        pc.thesis_title,
        CONCAT(cu.first_name, ' ', cu.last_name) AS candidate_name,
        CONCAT(su.first_name, ' ', su.last_name) AS supervisor_name,
        pr.name AS programme_name,
        vr.outcome,
        vr.correction_deadline,
        vr.final_comments
    FROM viva_schedules vs
    JOIN  phd_candidates pc ON vs.candidate_id = pc.id
    JOIN  users          cu ON pc.user_id       = cu.id
    LEFT JOIN users      su ON pc.supervisor_id = su.id
    JOIN  programmes     pr ON pc.programme_id  = pr.id
    LEFT JOIN viva_recommendations vr ON vs.id = vr.viva_id
    WHERE vs.id = p_viva_id;

    -- Examiner evaluations
    SELECT
        CONCAT(u.first_name, ' ', u.last_name) AS examiner_name,
        vi.role                                 AS examiner_role,
        ve.originality_score,
        ve.methodology_score,
        ve.presentation_score,
        ve.literature_score,
        ve.overall_score,
        ve.strengths,
        ve.weaknesses,
        ve.recommended_corrections,
        ve.general_comments,
        ve.submitted_at
    FROM viva_evaluations ve
    JOIN viva_examiners vi ON ve.viva_id = vi.viva_id AND ve.examiner_id = vi.examiner_id
    JOIN users u           ON ve.examiner_id = u.id
    WHERE ve.viva_id = p_viva_id
    ORDER BY vi.role;
END//

DELIMITER ;


-- ============================================================
--  SECTION 15 — SCHEDULED EVENTS
-- ============================================================

SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_daily_session_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL cleanup_expired_sessions();

CREATE EVENT IF NOT EXISTS evt_weekly_notification_archive
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO CALL archive_old_notifications();


-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
--  END OF SCHEMA — UEMS-PHD-VV v3.1
--  Kampala International University | © 2026 Spider Tabs Ltd
-- ============================================================