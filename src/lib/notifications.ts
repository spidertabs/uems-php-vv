import { query } from './db';

interface NotificationData {
  user_id?: number;
  student_id?: number;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  related_entity_type?: string;
  related_entity_id?: number;
}

/**
 * Creates a notification for a staff member or a student.
 */
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications
         (user_id, student_id, type, title, message, action_url, priority, related_entity_type, related_entity_id, is_read, created_at)
       VALUES (?, ?, ?::notification_type, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        data.user_id ?? null,
        data.student_id ?? null,
        data.type,
        data.title,
        data.message,
        data.action_url ?? null,
        data.priority ?? 'medium',
        data.related_entity_type ?? null,
        data.related_entity_id ?? null,
      ]
    );
  } catch (err) {
    console.error('❌ Notification failed:', err);
  }
}

/**
 * Notify all students enrolled in a specific course about a timetable update.
 */
export async function notifyEnrolledStudents(courseId: number, academicYear: number, semester: number, title: string, message: string, url: string) {
  const students = await query<{id: number}[]>(
    `SELECT student_id as id FROM course_enrollments 
     WHERE course_id = ? AND academic_year = ? AND semester = ?`,
    [courseId, academicYear, semester]
  );

  await Promise.all(
    students.map(s => createNotification({
      student_id: s.id,
      type: 'viva_scheduled', // Reusing type or I should add 'exam_scheduled'
      title,
      message,
      action_url: url,
      priority: 'high'
    }))
  );
}

/**
 * Notify a lecturer about an assigned supervision duty.
 */
export async function notifySupervisorAssigned(lecturerId: number, timetableId: number) {
  const [details]: any = await query(
    `SELECT ep.paper_code, c.title, et.exam_date, et.venue
     FROM exam_timetables et
     JOIN exam_papers ep ON et.exam_paper_id = ep.id
     JOIN courses c ON ep.course_id = c.id
     WHERE et.id = ?`,
    [timetableId]
  );

  if (details) {
    await createNotification({
      user_id: lecturerId,
      type: 'viva_scheduled',
      title: 'New Exam Supervision Duty',
      message: `You have been assigned to supervise ${details.paper_code} (${details.title}) on ${new Date(details.exam_date).toLocaleDateString()} at ${details.venue}.`,
      action_url: '/exams/supervision',
      priority: 'high',
      related_entity_type: 'exam_timetable',
      related_entity_id: timetableId
    });
  }
}
