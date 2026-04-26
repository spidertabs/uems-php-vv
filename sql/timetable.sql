-- ============================================================
--  UEMS-PHD-VV — Extensive Exam Timetable & Enrollment Seed Data (50+ Records)
-- ============================================================

-- 1. Published Exam Papers (Total 10)
INSERT INTO exam_papers (paper_code, course_id, created_by, exam_type, academic_year, semester, exam_date, duration, total_marks, status, published_at) VALUES
('EP-MIS2101-2026', 15, 31, 'FINAL', 2026, 1, '2026-05-15', 180, 100, 'published', NOW()),
('EP-CS2105-2026', 21, 30, 'FINAL', 2026, 1, '2026-05-16', 180, 100, 'published', NOW()),
('EP-LAW3101-2026', 19, 29, 'FINAL', 2026, 1, '2026-05-18', 180, 100, 'published', NOW()),
('EP-PH3102-2026', 22, 33, 'FINAL', 2026, 1, '2026-05-20', 180, 100, 'published', NOW()),
('EP-BSE1203-2026', 4, 32, 'CAT',   2026, 1, '2026-05-21', 120, 50,  'published', NOW()),
('EP-MIT7101-2026', 6, 28, 'FINAL', 2026, 1, '2026-05-22', 180, 100, 'published', NOW()),
('EP-MPH414-2026', 8, 34, 'FINAL', 2026, 1, '2026-05-23', 180, 100, 'published', NOW()),
('EP-ENV7208-2026', 7, 18, 'FINAL', 2026, 1, '2026-05-24', 180, 100, 'published', NOW()),
('EP-LLB1104-2026', 5, 10, 'FINAL', 2026, 1, '2026-05-25', 180, 100, 'published', NOW()),
('EP-UCC9105-2026', 11, 38, 'FINAL', 2026, 1, '2026-05-26', 180, 100, 'published', NOW())
ON CONFLICT (paper_code) DO NOTHING;

-- 2. Timetable Slots (Total 10)
INSERT INTO exam_timetables (exam_paper_id, exam_date, start_time, end_time, venue, capacity, created_by)
SELECT id, exam_date, '09:00:00', '12:00:00', 'Main Hall ' || (id % 3 + 1), 100, created_by 
FROM exam_papers WHERE paper_code LIKE 'EP-%'
ON CONFLICT (exam_paper_id) DO NOTHING;

-- 3. Student Course Enrollments (Total 50+)
-- Bulk Enroll Undergrads/Masters/PhD into relevant courses
INSERT INTO course_enrollments (student_id, course_id, academic_year, semester)
SELECT s.id, p.course_id, 2026, 1
FROM students s, exam_papers p
WHERE (
    -- Group 1: MIS students (Dept 15) -> MIS Course 15
    (s.department_id = 15 AND p.course_id = 15) OR
    -- Group 2: CS students (Dept 14) -> CS Course 21
    (s.department_id = 14 AND p.course_id = 21) OR
    -- Group 3: Law students (Dept 10) -> Law Course 19
    (s.department_id = 10 AND p.course_id = 19) OR
    -- Group 4: BSE students (Dept 16) -> BSE Course 4
    (s.department_id = 16 AND p.course_id = 4) OR
    -- Group 5: Public Health students (Dept 22) -> PH Course 22
    (s.department_id = 22 AND p.course_id = 22) OR
    -- Group 6: Everyone in common UCC courses
    (s.study_year = 1 AND p.course_id = 5)
)
AND s.is_active = TRUE
LIMIT 60
ON CONFLICT DO NOTHING;

-- 4. Sample Supervisor Assignments
INSERT INTO exam_supervisors (timetable_id, lecturer_id)
SELECT t.id, l.id
FROM exam_timetables t, staff l
WHERE l.role = 'lecturer' AND l.department_id = (SELECT c.department_id FROM exam_papers ep JOIN courses c ON ep.course_id = c.id WHERE ep.id = t.exam_paper_id)
LIMIT 20
ON CONFLICT DO NOTHING;
