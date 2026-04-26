-- ============================================================
--  UEMS-PHD-VV — Exam Timetable & Course Enrollment Seed Data
-- ============================================================

-- 1. Create Published Exam Papers
INSERT INTO exam_papers (paper_code, course_id, created_by, exam_type, academic_year, semester, exam_date, duration, total_marks, status, published_at) VALUES
('EP-UCC1102-2026', 2, 30, 'FINAL', 2026, 1, '2026-05-10', 180, 100, 'published', NOW()),
('EP-ITE1101-2026', 3, 31, 'FINAL', 2026, 1, '2026-05-12', 180, 100, 'published', NOW()),
('EP-COS1202-2026', 4, 30, 'FINAL', 2026, 1, '2026-05-14', 180, 100, 'published', NOW());

-- 2. Create Timetables for these Papers
INSERT INTO exam_timetables (exam_paper_id, exam_date, start_time, end_time, venue, capacity, created_by) VALUES
(1, '2026-05-10', '09:00:00', '12:00:00', 'Main Hall - Block A', 200, 30),
(2, '2026-05-12', '14:00:00', '17:00:00', 'BIT Lab - Level 2', 50, 31),
(3, '2026-05-14', '09:00:00', '12:00:00', 'Engineering Auditorium', 150, 30);

-- 3. Enroll Students for Courses (Academic Year 2026, Semester 1)
-- (Michael Kato [35], Fiona Nakamya [36], James Okello [37])
INSERT INTO course_enrollments (student_id, course_id, academic_year, semester) VALUES
(35, 2, 2026, 1), (36, 2, 2026, 1), (37, 2, 2026, 1), -- English Language Skills
(38, 3, 2026, 1), (39, 3, 2026, 1),                 -- Intro to IT
(35, 4, 2026, 1), (40, 4, 2026, 1);                 -- Computer Applications

-- 4. Assign Lecturers as Supervisors
-- (lect.cs1 [60], lect.it1 [61])
INSERT INTO exam_supervisors (timetable_id, lecturer_id) VALUES
(1, 60), (1, 61), -- Supervisors for UCC1102 Exam
(2, 60),          -- Supervisor for ITE1101 Exam
(3, 62);          -- Supervisor for COS1202 Exam
