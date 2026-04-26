import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDepartmentalTimetables, getStudentTimetable, getLecturerSupervisionSlots } from '@/lib/exams';
import { query } from '@/lib/db';
import { notifyEnrolledStudents, notifySupervisorAssigned } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let data;
    if (user.role === 'admin') {
      // Admins see everything
      data = await query(`
        SELECT et.*, ep.paper_code, c.title as course_title, c.code as course_code
        FROM exam_timetables et
        JOIN exam_papers ep ON et.exam_paper_id = ep.id
        JOIN courses c ON ep.course_id = c.id
        ORDER BY et.exam_date ASC
      `);
    } else if (user.role === 'hod' || user.role === 'dean') {
      data = await getDepartmentalTimetables(user.department_id!);
    } else if (user.role === 'lecturer') {
       // Lecturers see what they supervise
      data = await getLecturerSupervisionSlots(user.id);
    } else if (user.role === 'student') {
      data = await getStudentTimetable(user.id);
    } else {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ GET Timetable error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'hod' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      exam_paper_id, 
      course_id,
      exam_date, 
      start_time, 
      end_time, 
      venue, 
      capacity, 
      supervisor_ids 
    } = await request.json();

    let targetPaperId = exam_paper_id;

    // If only course_id is provided, find the latest published paper
    if (!targetPaperId && course_id) {
       const [paper]: any = await query(
         `SELECT id FROM exam_papers WHERE course_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 1`,
         [course_id]
       );
       if (paper) {
          targetPaperId = paper.id;
       }
    }

    if (!targetPaperId || !exam_date || !start_time || !end_time || !venue) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields. Please ensure a published paper exists for this course.' 
      }, { status: 400 });
    }

    // Use a transaction or sequential updates
    const result: any = await query(
      `INSERT INTO exam_timetables (exam_paper_id, exam_date, start_time, end_time, venue, capacity, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (exam_paper_id) DO UPDATE SET
         exam_date = EXCLUDED.exam_date,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         venue = EXCLUDED.venue,
         capacity = EXCLUDED.capacity,
         updated_at = NOW()
       RETURNING id`,
      [targetPaperId, exam_date, start_time, end_time, venue, capacity || null, user.id]
    );

    const timetableId = result[0]?.id;

    if (timetableId && supervisor_ids && Array.isArray(supervisor_ids)) {
      // Clear existing supervisors for this slot if any
      await query(`DELETE FROM exam_supervisors WHERE timetable_id = ?`, [timetableId]);
      
      // Add new ones
      for (const lectId of supervisor_ids) {
        await query(
          `INSERT INTO exam_supervisors (timetable_id, lecturer_id) VALUES (?, ?)`,
          [timetableId, lectId]
        );
        // Notify supervisor
        await notifySupervisorAssigned(lectId, timetableId);
      }
    }

    // Notify all enrolled students
    const [paperInfo]: any = await query(`SELECT course_id, academic_year, semester FROM exam_papers WHERE id = ?`, [targetPaperId]);
    if (paperInfo) {
      await notifyEnrolledStudents(
        paperInfo.course_id, 
        paperInfo.academic_year, 
        paperInfo.semester,
        'Exam Timetable Update',
        `The exam schedule for one of your courses has been set or updated. Venue: ${venue}`,
        '/exams/timetable'
      );
    }

    return NextResponse.json({ success: true, message: 'Timetable and supervisors updated' });
  } catch (error: any) {
    console.error('❌ POST Timetable error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
