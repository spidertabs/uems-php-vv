/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/question-bank/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (question_type === 'Multiple Choice' && !correct_answer) {
      return NextResponse.json(
        { error: 'Correct answer is required for multiple choice questions' },
        { status: 400 }
      );
    }

    // Check if user has permission to create questions for this course
    if (session.role === 'lecturer') {
      const permissions = await query<any[]>(
        `SELECT 1 FROM lecturer_permissions 
         WHERE lecturer_id = ? AND course_id = ? AND is_active = TRUE`,
        [session.id, course_id]
      );

      if (permissions.length === 0) {
        return NextResponse.json(
          { error: 'You do not have permission to create questions for this course' },
          { status: 403 }
        );
      }
    }

    // Insert question using the questions table structure
    const result = await query<any>(
      `INSERT INTO questions (
        course_id,
        study_unit_id,
        question_text,
        question_type,
        marks,
        difficulty_level,
        bloom_taxonomy,
        options,
        correct_answer,
        learning_outcome,
        keywords,
        tags,
        created_by,
        is_active,
        usage_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        session.id,
        1, // is_active
        0, // usage_count
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Question created successfully',
      questionId: result.insertId,
    });
  } catch (error) {
    console.error('POST /api/question-bank/create error:', error);
    return NextResponse.json(
      { error: 'Failed to create question', details: String(error) },
      { status: 500 }
    );
  }
}