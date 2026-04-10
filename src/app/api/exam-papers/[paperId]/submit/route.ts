/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

interface Course {
  department_id: number;
}

interface Department {
  id: number;
}

interface User {
  id: number;
  role: string;
  first_name: string;
  last_name: string;
}

export async function POST(
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

    console.log('Submitting paper with ID:', paperId);

    // Get paper details with course and department info
    const paperResult = await query<any[]>(
      `SELECT 
        ep.*,
        c.department_id,
        c.college_id
      FROM exam_papers ep
      JOIN courses c ON ep.course_id = c.id
      WHERE ep.id = ?`,
      [paperId]
    );

    if (!paperResult || paperResult.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = paperResult[0];

    // Check permissions
    if (paper.created_by !== session.id && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to submit this paper' },
        { status: 403 }
      );
    }

    if (paper.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft papers can be submitted' },
        { status: 403 }
      );
    }

    // Check if paper has questions
    const questionsResult = await query<any[]>(
      'SELECT COUNT(*) as count FROM exam_paper_questions WHERE exam_paper_id = ?',
      [paperId]
    );

    if (!questionsResult || questionsResult[0].count === 0) {
      return NextResponse.json(
        { error: 'Cannot submit paper without questions' },
        { status: 400 }
      );
    }

    // Check if paper has programmes assigned
    const programmesResult = await query<any[]>(
      'SELECT COUNT(*) as count FROM exam_paper_programmes WHERE exam_paper_id = ?',
      [paperId]
    );

    if (!programmesResult || programmesResult[0].count === 0) {
      return NextResponse.json(
        { error: 'Cannot submit paper without assigned programmes' },
        { status: 400 }
      );
    }

    // Find the HOD for this course's department
    const hodResult = await query<User[]>(
      `SELECT id, role, first_name, last_name 
       FROM users 
       WHERE role = 'hod' 
       AND department_id = ? 
       AND is_active = TRUE
       AND deleted_at IS NULL
       LIMIT 1`,
      [paper.department_id]
    );

    if (!hodResult || hodResult.length === 0) {
      return NextResponse.json(
        { error: 'No active HOD found for this department. Please contact administration.' },
        { status: 400 }
      );
    }

    const hod = hodResult[0];

    // Find the Dean for this course's college
    const deanResult = await query<User[]>(
      `SELECT id, role, first_name, last_name 
       FROM users 
       WHERE role = 'dean' 
       AND college_id = ? 
       AND is_active = TRUE
       AND deleted_at IS NULL
       LIMIT 1`,
      [paper.college_id]
    );

    const dean = deanResult && deanResult.length > 0 ? deanResult[0] : null;

    // Use transaction to update paper status and create workflow history
    await transaction(async (connection) => {
      // Update paper status and assign HOD/Dean
      await connection.execute(
        `UPDATE exam_papers 
         SET status = 'submitted',
             hod_id = ?,
             dean_id = ?,
             submitted_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [hod.id, dean ? dean.id : null, paperId]
      );

      // Create workflow history entry
      await connection.execute(
        `INSERT INTO workflow_history 
         (exam_paper_id, action, from_status, to_status, actor_id, actor_role, comments)
         VALUES (?, 'submitted', 'draft', 'submitted', ?, ?, ?)`,
        [
          paperId,
          session.id,
          session.role,
          `Paper submitted to HOD: ${hod.first_name} ${hod.last_name}`
        ]
      );

      // Create notification for HOD
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority, action_url)
         VALUES (?, 'approval_required', ?, ?, ?, 'high', ?)`,
        [
          hod.id,
          'New Exam Paper Awaiting Approval',
          `${session.first_name} ${session.last_name} has submitted exam paper ${paper.paper_code} for your review.`,
          paperId,
          `/exam-papers/${paperId}`
        ]
      );

      // Create notification for submitter
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, type, title, message, related_paper_id, priority, action_url)
         VALUES (?, 'paper_submitted', ?, ?, ?, 'medium', ?)`,
        [
          session.id,
          'Exam Paper Submitted Successfully',
          `Your exam paper ${paper.paper_code} has been submitted to HOD ${hod.first_name} ${hod.last_name} for review.`,
          paperId,
          `/exam-papers/${paperId}`
        ]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Paper submitted successfully',
      hod: {
        id: hod.id,
        name: `${hod.first_name} ${hod.last_name}`
      },
      dean: dean ? {
        id: dean.id,
        name: `${dean.first_name} ${dean.last_name}`
      } : null
    });
  } catch (error) {
    console.error('POST /api/exam-papers/[paperId]/submit error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit exam paper', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}