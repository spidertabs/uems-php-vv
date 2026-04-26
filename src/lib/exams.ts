import { query } from './db';

export interface ExamTimetable {
  id: number;
  exam_paper_id: number;
  paper_code: string;
  course_title: string;
  course_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: number;
  enrollment_count: number;
}

export interface CourseEnrollment {
  id: number;
  student_id: number;
  course_id: number;
  academic_year: number;
  semester: number;
  course_title: string;
  course_code: string;
}

/**
 * Fetch all exam timetables for a specific department (HOD view)
 */
export async function getDepartmentalTimetables(departmentId: number) {
  return query<ExamTimetable[]>(
    `SELECT 
        et.*,
        ep.paper_code,
        c.title as course_title,
        c.code as course_code,
        (SELECT COUNT(*) FROM course_enrollments ce 
         WHERE ce.course_id = c.id 
         AND ce.academic_year = ep.academic_year 
         AND ce.semester = ep.semester) as enrollment_count
      FROM exam_timetables et
      JOIN exam_papers ep ON et.exam_paper_id = ep.id
      JOIN courses c ON ep.course_id = c.id
      WHERE c.department_id = ?
      ORDER BY et.exam_date ASC, et.start_time ASC`,
    [departmentId]
  );
}

/**
 * Fetch exam timetables for courses a student is enrolled in
 */
export async function getStudentTimetable(studentId: number) {
  return query<ExamTimetable[]>(
    `SELECT 
        et.*,
        ep.paper_code,
        c.title as course_title,
        c.code as course_code
      FROM exam_timetables et
      JOIN exam_papers ep ON et.exam_paper_id = ep.id
      JOIN courses c ON ep.course_id = c.id
      JOIN course_enrollments ce ON ce.course_id = c.id 
        AND ce.academic_year = ep.academic_year 
        AND ce.semester = ep.semester
      WHERE ce.student_id = ?
      ORDER BY et.exam_date ASC, et.start_time ASC`,
    [studentId]
  );
}

/**
 * Fetch assigned supervisions for a lecturer
 */
export async function getLecturerSupervisionSlots(lecturerId: number) {
  return query<any[]>(
    `SELECT 
        es.id as supervision_id,
        et.*,
        ep.paper_code,
        c.title as course_title,
        c.code as course_code,
        (SELECT COUNT(*) FROM course_enrollments ce 
         WHERE ce.course_id = c.id 
         AND ce.academic_year = ep.academic_year 
         AND ce.semester = ep.semester) as enrollment_count
      FROM exam_supervisors es
      JOIN exam_timetables et ON es.timetable_id = et.id
      JOIN exam_papers ep ON et.exam_paper_id = ep.id
      JOIN courses c ON ep.course_id = c.id
      WHERE es.lecturer_id = ?
      ORDER BY et.exam_date ASC, et.start_time ASC`,
    [lecturerId]
  );
}

/**
 * Enroll a student in a course
 */
export async function enrollInCourse(studentId: number, courseId: number, year: number, semester: number) {
  return query(
    `INSERT INTO course_enrollments (student_id, course_id, academic_year, semester)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (student_id, course_id, academic_year, semester) DO NOTHING`,
    [studentId, courseId, year, semester]
  );
}

/**
 * Assign supervisor to a timetable slot
 */
export async function assignSupervisor(timetableId: number, lecturerId: number) {
  return query(
    `INSERT INTO exam_supervisors (timetable_id, lecturer_id)
     VALUES (?, ?)
     ON CONFLICT (timetable_id, lecturer_id) DO NOTHING`,
    [timetableId, lecturerId]
  );
}
