/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/question-bank/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionId = params.id;

    const questions = await query<any[]>(
      `SELECT 
        q.*,
        q.bloom_taxonomy as bloom_level,
        q.learning_outcome as answer_explanation,
        c.code AS course_code,
        c.title AS course_title,
        su.name AS study_unit_title,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
      FROM questions q
      LEFT JOIN courses c ON c.id = q.course_id
      LEFT JOIN study_units su ON su.id = q.study_unit_id
      LEFT JOIN users u ON u.id = q.created_by
      WHERE q.id = ? AND q.is_active = TRUE`,
      [questionId]
    );

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const question = questions[0];

    // Parse JSON fields
    if (question.options && typeof question.options === 'string') {
      question.options = JSON.parse(question.options);
    }
    if (question.tags && typeof question.tags === 'string') {
      question.tags = question.tags;
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error('GET /api/question-bank/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionId = params.id;
    const body = await request.json();
    const {
      course_id,
      study_unit_id,
      question_text,
      question_type,
      marks,
      difficulty_level,
      bloom_level,
      options,
      correct_answer,
      answer_explanation,
      tags,
    } = body;

    // Validation
    if (!course_id || !question_text || !question_type || !marks) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, question_text, question_type, and marks are required' },
        { status: 400 }
      );
    }

    if (marks < 1) {
      return NextResponse.json(
        { error: 'Marks must be at least 1' },
        { status: 400 }
      );
    }

    // Check if question exists
    const existing = await query<any[]>(
      'SELECT created_by FROM questions WHERE id = ? AND is_active = TRUE',
      [questionId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit = 
      session.role === 'hod' ||
      session.role === 'admin' ||
      session.role === 'dean' ||
      existing[0].created_by === session.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this question' },
        { status: 403 }
      );
    }

    // Update question
    await query(
      `UPDATE questions SET
        course_id = ?,
        study_unit_id = ?,
        question_text = ?,
        question_type = ?,
        marks = ?,
        difficulty_level = ?,
        bloom_taxonomy = ?,
        options = ?,
        correct_answer = ?,
        learning_outcome = ?,
        keywords = ?,
        tags = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        course_id,
        study_unit_id || null,
        question_text,
        question_type,
        marks,
        difficulty_level || 'Medium',
        bloom_level || 'Understand',
        options ? JSON.stringify(options) : null,
        correct_answer || null,
        answer_explanation || null,
        tags || null,
        tags || null,
        questionId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/question-bank/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionId = params.id;

    // Check if question exists
    const existing = await query<any[]>(
      'SELECT created_by FROM questions WHERE id = ? AND is_active = TRUE',
      [questionId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check permissions
    const canDelete =
      session.role === 'hod' ||
      session.role === 'admin' ||
      session.role === 'dean' ||
      existing[0].created_by === session.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this question' },
        { status: 403 }
      );
    }

    // Soft delete (mark as inactive)
    await query(
      'UPDATE questions SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [questionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/question-bank/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete question', details: String(error) },
      { status: 500 }
    );
  }
}