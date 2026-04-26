import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifySupervisorAssigned, notifyEnrolledStudents } from '@/lib/notifications';

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
        SELECT et.*, ep.paper_code, 
               COALESCE(c.title, pc.title) as course_title, 
               COALESCE(c.code, pc.code) as course_code,
               (
                 SELECT STRING_AGG(s.first_name || ' ' || s.last_name, ', ')
                 FROM exam_supervisors es
                 JOIN staff s ON es.lecturer_id = s.id
                 WHERE es.timetable_id = et.id
               ) as supervisor_names,
               (
                 SELECT JSON_AGG(lecturer_id)
                 FROM exam_supervisors
                 WHERE timetable_id = et.id
               ) as supervisor_ids
        FROM exam_timetables et
        LEFT JOIN exam_papers ep ON et.exam_paper_id = ep.id
        LEFT JOIN courses c ON et.course_id = c.id
        LEFT JOIN courses pc ON ep.course_id = pc.id
        ORDER BY et.exam_date ASC
      `);
    } else if (user.role === 'hod' || user.role === 'dean') {
      const deptId = user.department_id;
      if (!deptId) return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
      
      data = await query(`
        SELECT et.*, ep.paper_code, 
               COALESCE(c.title, pc.title) as course_title, 
               COALESCE(c.code, pc.code) as course_code,
               (
                 SELECT STRING_AGG(s.first_name || ' ' || s.last_name, ', ')
                 FROM exam_supervisors es
                 JOIN staff s ON es.lecturer_id = s.id
                 WHERE es.timetable_id = et.id
               ) as supervisor_names,
               (
                 SELECT JSON_AGG(lecturer_id)
                 FROM exam_supervisors
                 WHERE timetable_id = et.id
               ) as supervisor_ids
        FROM exam_timetables et
        LEFT JOIN exam_papers ep ON et.exam_paper_id = ep.id
        LEFT JOIN courses c ON et.course_id = c.id
        LEFT JOIN courses pc ON ep.course_id = pc.id
        WHERE COALESCE(c.department_id, pc.department_id) = ?
        ORDER BY et.exam_date ASC
      `, [deptId]);
    } else {
      // Lecturers and students see the general timetable
      data = await query(`
        SELECT et.*, ep.paper_code, 
               COALESCE(c.title, pc.title) as course_title, 
               COALESCE(c.code, pc.code) as course_code
        FROM exam_timetables et
        LEFT JOIN exam_papers ep ON et.exam_paper_id = ep.id
        LEFT JOIN courses c ON et.course_id = c.id
        LEFT JOIN courses pc ON ep.course_id = pc.id
        ORDER BY et.exam_date ASC
      `);
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

    const body = await request.json();
    const { 
      id,
      exam_paper_id, 
      course_id,
      exam_date, 
      start_time, 
      end_time, 
      venue, 
      capacity, 
      supervisor_ids 
    } = body;

    let targetPaperId = exam_paper_id;

    // Resolve paper if possible
    if (!targetPaperId && course_id) {
       const [paper]: any = await query(
         `SELECT id FROM exam_papers WHERE course_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 1`,
         [course_id]
       );
       if (paper) {
          targetPaperId = paper.id;
       }
    }

    if ((!targetPaperId && !course_id) || !exam_date || !start_time || !end_time || !venue) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields. Please select a course and provide date/time/venue.' 
      }, { status: 400 });
    }

    let timetableId = id;

    if (id) {
      // Direct update for existing slot
      await query(
        `UPDATE exam_timetables SET 
           exam_paper_id = ?, course_id = ?, exam_date = ?, 
           start_time = ?, end_time = ?, venue = ?, capacity = ?, updated_at = NOW()
         WHERE id = ?`,
        [targetPaperId || null, course_id || null, exam_date, start_time, end_time, venue, capacity || null, id]
      );
    } else {
      // Create or upsert
      const result: any = await query(
        `INSERT INTO exam_timetables (exam_paper_id, course_id, exam_date, start_time, end_time, venue, capacity, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (exam_paper_id) WHERE exam_paper_id IS NOT NULL 
         DO UPDATE SET
           exam_date = EXCLUDED.exam_date,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           venue = EXCLUDED.venue,
           capacity = EXCLUDED.capacity,
           updated_at = NOW()
         RETURNING id`,
        [targetPaperId || null, course_id || null, exam_date, start_time, end_time, venue, capacity || null, user.id]
      );
      
      timetableId = result[0]?.id;
      
      // Secondary fallback if insert-conflict didn't return ID (shouldn't happen with RETURNING but being safe)
      if (!timetableId && targetPaperId) {
         const [existing]: any = await query(`SELECT id FROM exam_timetables WHERE exam_paper_id = ?`, [targetPaperId]);
         timetableId = existing?.id;
      }
    }

    // Handle Supervisors
    if (timetableId && supervisor_ids && Array.isArray(supervisor_ids)) {
      // Clear existing assignments for this slot
      await query(`DELETE FROM exam_supervisors WHERE timetable_id = ?`, [timetableId]);
      
      // Add new assignments
      for (const lectId of supervisor_ids) {
        await query(
          `INSERT INTO exam_supervisors (timetable_id, lecturer_id) VALUES (?, ?)`,
          [timetableId, lectId]
        );
        // Async notification (don't block the response)
        notifySupervisorAssigned(lectId, timetableId).catch(err => console.error('Notification error:', err));
      }
    }

    // Async notification for students
    if (course_id) {
       notifyEnrolledStudents(
         course_id, 2026, 1, 
         'Exam Timetable Update', 
         `Exam schedule fixed for your course. Venue: ${venue}`,
         '/exams/timetable'
       ).catch(err => console.error('Student notification error:', err));
    }

    return NextResponse.json({ success: true, message: 'Timetable updated successfully' });
  } catch (error: any) {
    console.error('❌ POST Timetable error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
