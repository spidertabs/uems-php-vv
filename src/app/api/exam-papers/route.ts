/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';
import { query, transaction } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import type { Course, ExamPaper } from '@/types';

interface ExamPaperRow extends ExamPaper {
  course_code: string;
  course_title: string;
  created_by_name: string;
  hod_name: string | null;
  dean_name: string | null;
  programmes?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: user_id, department_id, college_id } = session;
    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');

    let sql = `
      SELECT 
        ep.id,
        ep.paper_code,
        ep.exam_type,
        ep.academic_year,
        ep.semester,
        ep.exam_date,
        ep.duration,
        ep.total_marks,
        ep.status,
        ep.created_at,
        ep.submitted_at,
        ep.hod_id,
        ep.dean_id,
        c.code AS course_code,
        c.title AS course_title,
        c.department_id,
        c.college_id,
        CONCAT(creator.first_name, ' ', creator.last_name) AS created_by_name,
        CONCAT(hod.first_name, ' ', hod.last_name) AS hod_name,
        CONCAT(dean.first_name, ' ', dean.last_name) AS dean_name,
        ep.created_by,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as programmes
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN users creator ON ep.created_by = creator.id
      LEFT JOIN users hod ON ep.hod_id = hod.id
      LEFT JOIN users dean ON ep.dean_id = dean.id
      LEFT JOIN exam_paper_programmes epp ON ep.id = epp.exam_paper_id
      LEFT JOIN programmes p ON epp.programme_id = p.id
      WHERE ep.deleted_at IS NULL
    `;

    const params: (string | number)[] = [];

    // Filter by course if specified
    if (course_id) {
      sql += ` AND ep.course_id = ?`;
      params.push(course_id);
    }

    // Filter based on role
    if (role === 'lecturer') {
      sql += `
        AND (ep.created_by = ? OR EXISTS (
          SELECT 1 FROM lecturer_permissions lp 
          WHERE lp.lecturer_id = ? 
          AND lp.course_id = ep.course_id 
          AND lp.is_active = TRUE
        ))
      `;
      params.push(user_id, user_id);
    } else if (role === 'hod') {
      sql += ` AND c.department_id = ?`;
      params.push(department_id!);
    } else if (role === 'dean') {
      sql += ` AND c.college_id = ?`;
      params.push(college_id!);
    }

    sql += ` GROUP BY ep.id ORDER BY ep.created_at DESC`;

    const papers = await query<ExamPaperRow[]>(sql, params);

    return NextResponse.json({
      success: true,
      papers,
      count: papers.length,
    });
  } catch (error) {
    console.error('❌ GET /api/exam-papers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam papers', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      course_id,
      exam_type,
      academic_year,
      semester,
      exam_date,
      duration,
      instructions,
      programme_ids,
    } = body;

    // Validate required fields
    if (!course_id || !exam_type || !academic_year || !semester) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that at least one programme is selected
    if (!programme_ids || !Array.isArray(programme_ids) || programme_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one programme must be assigned' },
        { status: 400 }
      );
    }

    // Get course details including department and college
    const courseResult = await query<any[]>(
      'SELECT code, department_id, college_id FROM courses WHERE id = ?',
      [course_id]
    );

    if (!courseResult || courseResult.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courseResult[0];
    const courseCode = course.code;
    const paper_code = `${courseCode}-${exam_type}-${academic_year}-S${semester}`;

    // Get HOD for the course's department
    const hodResult = await query<{ id: number }[]>(
      `SELECT id 
       FROM users 
       WHERE role = 'hod' 
       AND department_id = ? 
       AND is_active = TRUE
       AND deleted_at IS NULL
       LIMIT 1`,
      [course.department_id]
    );

    const hod_id = hodResult.length > 0 ? hodResult[0].id : null;

    // Get Dean for the course's college
    const deanResult = await query<{ id: number }[]>(
      `SELECT id 
       FROM users 
       WHERE role = 'dean' 
       AND college_id = ? 
       AND is_active = TRUE
       AND deleted_at IS NULL
       LIMIT 1`,
      [course.college_id]
    );

    const dean_id = deanResult.length > 0 ? deanResult[0].id : null;

    // Use transaction to create paper and assign programmes atomically
    const paper_id = await transaction(async (connection) => {
      const insertSql = `
        INSERT INTO exam_papers (
          paper_code, course_id, created_by, exam_type,
          academic_year, semester, exam_date, duration,
          instructions, status, hod_id, dean_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
      `;

      const [result] = await connection.execute(insertSql, [
        paper_code,
        course_id,
        session.id,
        exam_type,
        academic_year,
        semester,
        exam_date || null,
        duration || null,
        instructions || null,
        hod_id,
        dean_id,
      ]);

      const newPaperId = (result as ResultSetHeader).insertId;

      // Insert programme associations
      if (programme_ids.length > 0) {
        const placeholders = programme_ids.map(() => '(?, ?)').join(', ');
        const flatValues = programme_ids.flatMap((progId: number) => [newPaperId, progId]);

        await connection.execute(
          `INSERT INTO exam_paper_programmes (exam_paper_id, programme_id) VALUES ${placeholders}`,
          flatValues
        );
      }

      // Create workflow history entry
      await connection.execute(
        `INSERT INTO workflow_history (exam_paper_id, action, from_status, to_status, actor_id, actor_role)
         VALUES (?, 'created', NULL, 'draft', ?, ?)`,
        [newPaperId, session.id, session.role]
      );

      return newPaperId;
    });

    return NextResponse.json({
      success: true,
      paper_id,
      paper_code,
      message: 'Exam paper created successfully',
    });
  } catch (error) {
    console.error('❌ POST /api/exam-papers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create exam paper', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Paper ID required' }, { status: 400 });
    }

    // Check if paper exists and user has permission
    const paperResult = await query<any[]>(
      'SELECT created_by, status FROM exam_papers WHERE id = ?',
      [id]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Only allow deletion of draft papers by creator or admin
    if (paper.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft papers can be deleted' },
        { status: 403 }
      );
    }

    if (paper.created_by !== session.id && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to delete this paper' },
        { status: 403 }
      );
    }

    // Delete paper (CASCADE will handle exam_paper_programmes and exam_paper_questions)
    await query('DELETE FROM exam_papers WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Exam paper deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/exam-papers error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam paper', details: String(error) },
      { status: 500 }
    );
  }
}