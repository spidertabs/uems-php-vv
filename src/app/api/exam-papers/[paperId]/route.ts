// src/app/api/exam-papers/[paperId]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    console.log('Fetching paper with ID:', paperId);

    // Fetch paper details with college name
    const paperSql = `
      SELECT 
        ep.*,
        c.code AS course_code,
        c.title AS course_title,
        c.department_id,
        c.college_id,
        col.name AS college_name,
        dept.name AS department_name,
        CONCAT(creator.first_name, ' ', creator.last_name) AS created_by_name,
        CONCAT(hod.first_name, ' ', hod.last_name) AS hod_name,
        CONCAT(dean.first_name, ' ', dean.last_name) AS dean_name
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      LEFT JOIN colleges col ON c.college_id = col.id
      LEFT JOIN departments dept ON c.department_id = dept.id
      LEFT JOIN users creator ON ep.created_by = creator.id
      LEFT JOIN users hod ON ep.hod_id = hod.id
      LEFT JOIN users dean ON ep.dean_id = dean.id
      WHERE ep.id = ?
    `;

    const paperResult = await query<any[]>(paperSql, [paperId]);

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Check access permissions
    const { role, id: user_id, department_id, college_id } = session;
    let hasAccess = false;

    if (role === 'admin' || role === 'exam_master') {
      hasAccess = true;
    } else if (role === 'lecturer') {
      hasAccess = paper.created_by === user_id;
    } else if (role === 'hod') {
      hasAccess = paper.department_id === department_id;
    } else if (role === 'dean') {
      hasAccess = paper.college_id === college_id;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Not authorized to view this paper' },
        { status: 403 }
      );
    }

    // Fetch questions in the paper
    const questionsSql = `
      SELECT 
        epq.*,
        q.question_text,
        q.question_type,
        q.difficulty_level,
        q.bloom_taxonomy,
        q.options,
        q.correct_answer,
        su.name AS study_unit_name
      FROM exam_paper_questions epq
      JOIN questions q ON epq.question_id = q.id
      LEFT JOIN study_units su ON q.study_unit_id = su.id
      WHERE epq.exam_paper_id = ?
      ORDER BY epq.section ASC, epq.sequence_order ASC
    `;

    const questions = await query<any[]>(questionsSql, [paperId]);

    // Parse JSON fields
    const processedQuestions = questions.map(q => ({
      ...q,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      option_order: q.option_order ? (typeof q.option_order === 'string' ? JSON.parse(q.option_order) : q.option_order) : null,
    }));

    // Fetch associated programmes
    const programmesSql = `
      SELECT 
        p.id,
        p.code,
        p.name,
        p.level,
        p.duration_years,
        d.name as department_name,
        d.code as department_code,
        c.name as college_name,
        c.code as college_code
      FROM programmes p
      JOIN exam_paper_programmes epp ON p.id = epp.programme_id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN colleges c ON p.college_id = c.id
      WHERE epp.exam_paper_id = ?
      ORDER BY p.code ASC
    `;

    const programmes = await query<any[]>(programmesSql, [paperId]);

    return NextResponse.json({
      success: true,
      paper,
      questions: processedQuestions,
      programmes,
    });
  } catch (error) {
    console.error('GET /api/exam-papers/[paperId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam paper', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;
    const body = await request.json();

    console.log('Updating paper with ID:', paperId);

    // Check if paper exists and get current status
    const paperResult = await query<any[]>(
      'SELECT created_by, status FROM exam_papers WHERE id = ?',
      [paperId]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Only creator can edit draft papers
    if (paper.created_by !== session.id && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to edit this paper' },
        { status: 403 }
      );
    }

    if (paper.status !== 'draft' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only draft papers can be edited' },
        { status: 403 }
      );
    }

    // Use transaction to update paper and programmes atomically
    await transaction(async (connection) => {
      // Update paper fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const allowedFields = [
        'exam_type',
        'academic_year',
        'semester',
        'exam_date',
        'duration',
        'instructions',
        'total_marks',
      ];

      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(body[field]);
        }
      });

      if (updateFields.length > 0) {
        updateValues.push(paperId);
        const updateSql = `
          UPDATE exam_papers 
          SET ${updateFields.join(', ')}, updated_at = NOW()
          WHERE id = ?
        `;

        await connection.execute(updateSql, updateValues);
      }

      // Update programmes if provided
      if (body.programme_ids && Array.isArray(body.programme_ids)) {
        const programmeIds = body.programme_ids;

        // Validate that at least one programme is selected
        if (programmeIds.length === 0) {
          throw new Error('At least one programme must be assigned');
        }

        // Delete existing programme associations
        await connection.execute(
          'DELETE FROM exam_paper_programmes WHERE exam_paper_id = ?',
          [paperId]
        );

        // Insert new programme associations
        if (programmeIds.length > 0) {
          const programmeValues = programmeIds.map((progId: number) => [
            paperId,
            progId,
          ]);

          const placeholders = programmeIds.map(() => '(?, ?)').join(', ');
          const flatValues = programmeValues.flat();

          await connection.execute(
            `INSERT INTO exam_paper_programmes (exam_paper_id, programme_id) VALUES ${placeholders}`,
            flatValues
          );
        }
      }
    });

    // Fetch updated programmes to return
    const programmes = await query<any[]>(
      `SELECT 
        p.id,
        p.code,
        p.name,
        p.level
      FROM programmes p
      JOIN exam_paper_programmes epp ON p.id = epp.programme_id
      WHERE epp.exam_paper_id = ?
      ORDER BY p.code ASC`,
      [paperId]
    );

    return NextResponse.json({
      success: true,
      message: 'Exam paper updated successfully',
      programmes,
    });
  } catch (error) {
    console.error('PUT /api/exam-papers/[paperId] error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update exam paper', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    console.log('Deleting paper with ID:', paperId);

    // Check if paper exists and user has permission
    const paperResult = await query<any[]>(
      'SELECT created_by, status FROM exam_papers WHERE id = ?',
      [paperId]
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
    await query('DELETE FROM exam_papers WHERE id = ?', [paperId]);

    return NextResponse.json({
      success: true,
      message: 'Exam paper deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/exam-papers/[paperId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam paper', details: String(error) },
      { status: 500 }
    );
  }
}