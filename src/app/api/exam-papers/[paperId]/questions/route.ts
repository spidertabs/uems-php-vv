/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/exam-papers/[paperId]/questions/route.ts
// FIXED: Per-section numbering + explicit sub-question capability control
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Generic query helper
async function query<T>(sql: string, params: any[] = []): Promise<T> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching questions for paper ID:', paperId);

    // Fetch questions for this paper with parent-child relationships
    const paperQuestions = await query<any[]>(
      `SELECT 
        epq.*,
        q.question_text,
        q.question_type,
        q.difficulty_level,
        q.bloom_taxonomy as bloom_level,
        q.options,
        q.correct_answer,
        c.code as course_code,
        c.title as course_title,
        su.name as study_unit_title,
        q.usage_count,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        parent_epq.question_number as parent_question_number,
        parent_epq.display_number as parent_display_number
      FROM exam_paper_questions epq
      JOIN questions q ON epq.question_id = q.id
      JOIN courses c ON q.course_id = c.id
      LEFT JOIN study_units su ON q.study_unit_id = su.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN exam_paper_questions parent_epq ON epq.parent_question_id = parent_epq.id
      WHERE epq.exam_paper_id = ?
      ORDER BY epq.section ASC, epq.sequence_order ASC, epq.indentation_level ASC`,
      [paperId]
    );

    console.log('Found paper questions:', paperQuestions.length);

    // Format the response
    const questions = paperQuestions.map((pq, index) => ({
      id: pq.id,
      question_id: pq.question_id,
      question_number: pq.question_number || (index + 1),
      display_number: pq.display_number,
      sequence_order: pq.sequence_order,
      marks: pq.marks,
      section: pq.section || 'A',
      parent_question_id: pq.parent_question_id,
      indentation_level: pq.indentation_level || 0,
      parent_question_number: pq.parent_question_number,
      parent_display_number: pq.parent_display_number,
      option_order: pq.option_order ? (typeof pq.option_order === 'string' ? JSON.parse(pq.option_order) : pq.option_order) : null,
      can_have_sub_questions: pq.can_have_sub_questions ?? true,
      question: {
        id: pq.question_id,
        question_text: pq.question_text,
        question_type: pq.question_type,
        marks: pq.marks,
        difficulty_level: pq.difficulty_level,
        bloom_level: pq.bloom_level,
        course_code: pq.course_code,
        course_title: pq.course_title,
        study_unit_title: pq.study_unit_title,
        created_by_name: pq.created_by_name,
        usage_count: pq.usage_count,
        options: pq.options ? (typeof pq.options === 'string' ? JSON.parse(pq.options) : pq.options) : null,
        correct_answer: pq.correct_answer,
      }
    }));

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error('GET /api/exam-papers/[paperId]/questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper questions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      question_id, 
      marks, 
      section, 
      option_order, 
      parent_question_id, 
      indentation_level,
      is_sub_question,
      can_have_sub_questions = true // NEW: User can specify if question should allow sub-questions
    } = body;

    console.log('📝 POST Request - Adding question to paper:', { 
      paperId, 
      question_id, 
      marks, 
      section: section || 'A (default)', 
      option_order: option_order ? 'Yes' : 'No',
      parent_question_id: parent_question_id || 'None (main question)',
      indentation_level: indentation_level || 0,
      is_sub_question: is_sub_question || false,
      can_have_sub_questions: can_have_sub_questions
    });

    // Validation
    if (!question_id) {
      console.error('❌ Validation failed: question_id is missing');
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    // If this is a sub-question, validate parent exists and get the root parent
    let rootParentId = parent_question_id;
    let rootQuestionNumber = null;
    let parentSection = null;
    let isFirstSubQuestion = false;
    
    if (parent_question_id) {
      const parentExists = await query<any[]>(
        'SELECT id, section, sequence_order, question_number, display_number, parent_question_id, sub_question_label, can_have_sub_questions FROM exam_paper_questions WHERE id = ? AND exam_paper_id = ?',
        [parent_question_id, paperId]
      );

      if (parentExists.length === 0) {
        console.error('❌ Parent question not found:', parent_question_id);
        return NextResponse.json(
          { error: 'Parent question not found in this paper' },
          { status: 404 }
        );
      }

      // Check if parent allows sub-questions
      if (parentExists[0].can_have_sub_questions === false || parentExists[0].can_have_sub_questions === 0) {
        console.error('❌ Parent question does not allow sub-questions');
        return NextResponse.json(
          { error: 'This question cannot have sub-questions. The creator disabled this option.' },
          { status: 400 }
        );
      }

      parentSection = parentExists[0].section;
      
      // Find the root parent (main question) by traversing up
      let currentParentId = parent_question_id;
      let depth = 0;
      const maxDepth = 10;
      
      while (depth < maxDepth) {
        const checkParent = await query<any[]>(
          'SELECT id, parent_question_id, question_number FROM exam_paper_questions WHERE id = ?',
          [currentParentId]
        );
        
        if (checkParent.length === 0) break;
        
        if (!checkParent[0].parent_question_id) {
          rootParentId = checkParent[0].id;
          rootQuestionNumber = checkParent[0].question_number;
          break;
        }
        
        currentParentId = checkParent[0].parent_question_id;
        depth++;
      }
      
      // Check if root parent already has a sub_question_label
      const rootParentInfo = await query<any[]>(
        'SELECT sub_question_label FROM exam_paper_questions WHERE id = ?',
        [rootParentId]
      );
      
      // If root parent doesn't have a sub_question_label, this is the first sub-question
      isFirstSubQuestion = !rootParentInfo[0]?.sub_question_label;
      
      console.log('✅ Parent question found. Root parent ID:', rootParentId, 'Root number:', rootQuestionNumber, 'Is first sub-question:', isFirstSubQuestion);
    }

    // Check if question exists
    const questions = await query<any[]>(
      'SELECT id, marks, question_type FROM questions WHERE id = ? AND is_active = 1',
      [question_id]
    );

    console.log('🔍 Question lookup result:', questions.length > 0 ? 'Found' : 'Not found');

    if (questions.length === 0) {
      console.error('❌ Question not found or inactive:', question_id);
      return NextResponse.json(
        { error: 'Question not found or inactive' },
        { status: 404 }
      );
    }

    console.log('📋 Question type:', questions[0].question_type);

    // Prevent MCQs and True/False from being added as sub-questions
    if (parent_question_id) {
      const questionType = questions[0].question_type.toLowerCase().replace(/\s+/g, '_');
      console.log('📋 Normalized question type:', questionType);
      
      if (questionType === 'multiple_choice' || questionType === 'true_false') {
        console.error('❌ MCQs and True/False questions cannot be added as sub-questions');
        return NextResponse.json(
          { error: 'Multiple choice and True/False questions cannot be added as sub-questions' },
          { status: 400 }
        );
      }
      
      console.log('✅ Question type is valid for sub-question:', questionType);
    }

    // Check if question is already added to this paper
    const existing = await query<any[]>(
      'SELECT id, parent_question_id FROM exam_paper_questions WHERE exam_paper_id = ? AND question_id = ? AND (parent_question_id <=> ?)',
      [paperId, question_id, parent_question_id || null]
    );

    console.log('🔍 Duplicate check:', existing.length > 0 ? 'Already exists in this context' : 'New question');

    if (existing.length > 0) {
      console.error('❌ Question already added to paper in this context');
      return NextResponse.json(
        { error: 'Question already added to this paper in this context' },
        { status: 409 }
      );
    }

    // Get the next sequence_order and section
    let sectionValue: string;
    let nextSequenceOrder: number;
    let mainQuestionNumber: number;
    
    if (parent_question_id) {
      // For sub-questions, inherit parent's section
      const parentInfo = await query<any[]>(
        'SELECT section FROM exam_paper_questions WHERE id = ?',
        [parent_question_id]
      );
      
      if (parentInfo.length === 0) {
        console.error('❌ Parent not found when fetching section');
        return NextResponse.json(
          { error: 'Parent question not found' },
          { status: 404 }
        );
      }
      
      sectionValue = parentInfo[0].section;
      
      // Get the next sequence_order for sub-questions under the immediate parent
      const maxSubSeq = await query<any[]>(
        'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_seq FROM exam_paper_questions WHERE exam_paper_id = ? AND parent_question_id = ?',
        [paperId, parent_question_id]
      );
      nextSequenceOrder = maxSubSeq[0]?.next_seq || 1;
      
      // Use root question number - extract just the numeric part
      const numMatch = String(rootQuestionNumber).match(/^(\d+)/);
      mainQuestionNumber = numMatch ? parseInt(numMatch[1]) : 1;
      
      console.log('📌 Sub-question assigned:', { 
        section: sectionValue, 
        sequence_order: nextSequenceOrder,
        parent_id: parent_question_id,
        root_parent_id: rootParentId,
        main_question_number: mainQuestionNumber,
        is_first_sub: isFirstSubQuestion
      });
    } else {
      // For main questions, use provided section
      sectionValue = section || 'A';
      
      // Count main questions in THIS SECTION (numbering restarts per section)
      const maxMainQ = await query<any[]>(
        'SELECT COALESCE(MAX(CAST(question_number AS UNSIGNED)), 0) + 1 as next_num FROM exam_paper_questions WHERE exam_paper_id = ? AND section = ? AND parent_question_id IS NULL',
        [paperId, sectionValue]
      );
      mainQuestionNumber = maxMainQ[0]?.next_num || 1;
      
      // Get sequence order (for ordering within section)
      const maxSeq = await query<any[]>(
        'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_seq FROM exam_paper_questions WHERE exam_paper_id = ? AND section = ? AND parent_question_id IS NULL',
        [paperId, sectionValue]
      );
      nextSequenceOrder = maxSeq[0]?.next_seq || 1;
      
      console.log('📌 Main question assigned:', { 
        section: sectionValue, 
        sequence_order: nextSequenceOrder,
        question_number: mainQuestionNumber,
        note: 'Numbering restarts per section'
      });
    }

    // Generate question number based on parent and indentation level
    let questionNumber = String(mainQuestionNumber);
    let displayNumber = questionNumber;
    let subQuestionLabel = null;

    if (parent_question_id) {
      const level = indentation_level || 1;

      // NEW LOGIC: If this is the first sub-question, update parent to be (a)
      if (isFirstSubQuestion && level === 1) {
        console.log('🔄 This is the first sub-question. Updating parent to be (a)...');
        
        // Update the parent question to have sub_question_label = 'a'
        await query(
          `UPDATE exam_paper_questions 
           SET sub_question_label = 'a',
               question_number = CONCAT(?, 'a'),
               display_number = CONCAT(?, '(a)'),
               indentation_level = 1
           WHERE id = ?`,
          [mainQuestionNumber, mainQuestionNumber, rootParentId]
        );
        
        console.log('✅ Parent updated to (a)');
        
        // This new sub-question becomes (b)
        const letter = 'b';
        subQuestionLabel = letter;
        questionNumber = `${mainQuestionNumber}${letter}`;
        displayNumber = `${mainQuestionNumber}(${letter})`;
      } else {
        // Count existing sub-questions at this level
        if (level === 1) {
          // Level 1: Count all existing level 1 items INCLUDING the root parent if it has a label
          // This ensures we get a, b, c, d... sequence without gaps
          const countQuery = await query<any[]>(
            `SELECT sub_question_label
             FROM exam_paper_questions 
             WHERE exam_paper_id = ?
             AND indentation_level = 1
             AND sub_question_label IS NOT NULL
             AND (id = ? OR parent_question_id = ?)
             ORDER BY sub_question_label`,
            [paperId, rootParentId, rootParentId]
          );
          
          // Find the highest letter used
          let maxIndex = 0;
          countQuery.forEach(row => {
            const label = row.sub_question_label;
            if (label && label.length === 1) {
              const charCode = label.charCodeAt(0) - 96; // 'a' = 1, 'b' = 2, etc.
              if (charCode > maxIndex) {
                maxIndex = charCode;
              }
            }
          });
          
          const subIndex = maxIndex + 1;
          const letter = String.fromCharCode(96 + subIndex);
          subQuestionLabel = letter;
          questionNumber = `${mainQuestionNumber}${letter}`;
          displayNumber = `${mainQuestionNumber}(${letter})`;
          
          console.log('📊 Level 1 existing labels:', countQuery.map(r => r.sub_question_label), 'Max index:', maxIndex, 'New index:', subIndex, 'Letter:', letter);
        } else if (level === 2) {
          // Level 2: i, ii, iii, iv...
          const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 
                         'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
          
          // Get immediate parent's letter
          const immediateParent = await query<any[]>(
            'SELECT sub_question_label FROM exam_paper_questions WHERE id = ?',
            [parent_question_id]
          );
          const parentLetter = immediateParent[0]?.sub_question_label || '';
          
          // Count level 2 sub-questions under this immediate parent
          const countQuery = await query<any[]>(
            `SELECT COUNT(*) as count 
             FROM exam_paper_questions 
             WHERE exam_paper_id = ?
             AND parent_question_id = ?
             AND indentation_level = 2
             AND sub_question_label IS NOT NULL`,
            [paperId, parent_question_id]
          );
          
          const existingCount = countQuery[0]?.count || 0;
          const subIndex = existingCount + 1;
          
          const romanNumeral = roman[subIndex - 1] || `(${subIndex})`;
          subQuestionLabel = romanNumeral;
          questionNumber = `${mainQuestionNumber}${parentLetter}${romanNumeral}`;
          displayNumber = `${mainQuestionNumber}(${parentLetter})(${romanNumeral})`;
        } else {
          // Level 3+: numeric
          const countQuery = await query<any[]>(
            `SELECT COUNT(*) as count 
             FROM exam_paper_questions 
             WHERE exam_paper_id = ?
             AND parent_question_id = ?
             AND indentation_level = ?
             AND sub_question_label IS NOT NULL`,
            [paperId, parent_question_id, level]
          );
          
          const existingCount = countQuery[0]?.count || 0;
          const subIndex = existingCount + 1;
          
          subQuestionLabel = String(subIndex);
          questionNumber = `${mainQuestionNumber}.${subIndex}`;
          displayNumber = questionNumber;
        }
      }
      
      console.log('🔢 Sub-question numbering:', {
        level,
        label: subQuestionLabel,
        display: displayNumber,
        main_question: mainQuestionNumber,
        root_parent: rootParentId,
        is_first: isFirstSubQuestion
      });
    }

    console.log('🔢 Generated question number:', questionNumber, 'Display:', displayNumber, 'Sub-label:', subQuestionLabel);

    // Prepare option_order for storage
    let optionOrderValue = null;
    if (option_order && Array.isArray(option_order)) {
      optionOrderValue = JSON.stringify(option_order);
      console.log('🔀 Option order saved:', optionOrderValue);
    }

    // Add question to paper
    console.log('💾 Inserting into database...');
    const result = await query<any>(
      `INSERT INTO exam_paper_questions (
        exam_paper_id,
        question_id,
        question_number,
        display_number,
        sub_question_label,
        sequence_order,
        marks,
        section,
        option_order,
        is_required,
        parent_question_id,
        indentation_level,
        can_have_sub_questions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paperId, 
        question_id, 
        questionNumber,
        displayNumber,
        subQuestionLabel,
        nextSequenceOrder,
        marks || questions[0].marks,
        sectionValue,
        optionOrderValue,
        1,
        parent_question_id || null,
        indentation_level || 0,
        can_have_sub_questions ? 1 : 0
      ]
    );

    console.log('✅ Insert successful. Result:', result);

    // Update question usage count
    await query(
      'UPDATE questions SET usage_count = usage_count + 1 WHERE id = ?',
      [question_id]
    );

    console.log('✅ Question usage count updated');

    const response = {
      success: true,
      message: is_sub_question ? 'Sub-question added successfully' : 'Question added to paper successfully',
      data: {
        question_id,
        section: sectionValue,
        sequence_order: nextSequenceOrder,
        marks: marks || questions[0].marks,
        question_number: questionNumber,
        display_number: displayNumber,
        sub_question_label: subQuestionLabel,
        parent_question_id: parent_question_id || null,
        indentation_level: indentation_level || 0,
        can_have_sub_questions: can_have_sub_questions
      }
    };

    console.log('✅ Sending success response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ POST /api/exam-papers/[paperId]/questions error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to add question to paper', 
        message: error instanceof Error ? error.message : String(error),
        details: String(error) 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { paperId: string } | Promise<{ paperId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const paperId = resolvedParams.paperId;

    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('question_id');
    const epqId = searchParams.get('epq_id');

    console.log('🗑️  DELETE Request - Removing question:', { paperId, questionId, epqId });

    if (!questionId && !epqId) {
      console.error('❌ Validation failed: question_id or epq_id is required');
      return NextResponse.json(
        { error: 'question_id or epq_id is required' },
        { status: 400 }
      );
    }

    let whereClause = 'exam_paper_id = ?';
    const whereParams: any[] = [paperId];

    if (epqId) {
      whereClause += ' AND id = ?';
      whereParams.push(epqId);
    } else if (questionId) {
      whereClause += ' AND question_id = ?';
      whereParams.push(questionId);
    }

    const existing = await query<any[]>(
      `SELECT id, question_id, section, parent_question_id FROM exam_paper_questions WHERE ${whereClause}`,
      whereParams
    );

    console.log('🔍 Question lookup:', existing.length > 0 ? `Found in section ${existing[0].section}` : 'Not found');

    if (existing.length === 0) {
      console.error('❌ Question not found in paper');
      return NextResponse.json(
        { error: 'Question not found in this paper' },
        { status: 404 }
      );
    }

    const questionToDelete = existing[0];

    // Check if this question has sub-questions
    const subQuestions = await query<any[]>(
      'SELECT id, question_id FROM exam_paper_questions WHERE parent_question_id = ?',
      [questionToDelete.id]
    );

    if (subQuestions.length > 0) {
      console.log('⚠️  Question has', subQuestions.length, 'sub-questions');
      
      // Delete all sub-questions first
      await query(
        'DELETE FROM exam_paper_questions WHERE parent_question_id = ?',
        [questionToDelete.id]
      );
      console.log('✅ Deleted', subQuestions.length, 'sub-questions');
      
      // Decrement usage count for each sub-question
      for (const subQ of subQuestions) {
        await query(
          'UPDATE questions SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = ?',
          [subQ.question_id]
        );
      }
    }

    // Check if deleting this will leave parent with no sub-questions
    if (questionToDelete.parent_question_id) {
      const remainingSiblings = await query<any[]>(
        'SELECT COUNT(*) as count FROM exam_paper_questions WHERE parent_question_id = ? AND id != ?',
        [questionToDelete.parent_question_id, questionToDelete.id]
      );
      
      if (remainingSiblings[0].count === 0) {
        // This was the last sub-question, revert parent back to main question format
        const parentInfo = await query<any[]>(
          'SELECT question_number FROM exam_paper_questions WHERE id = ?',
          [questionToDelete.parent_question_id]
        );
        
        if (parentInfo.length > 0) {
          const mainNum = parentInfo[0].question_number.match(/^(\d+)/);
          if (mainNum) {
            await query(
              `UPDATE exam_paper_questions 
               SET sub_question_label = NULL,
                   question_number = ?,
                   display_number = ?
               WHERE id = ?`,
              [mainNum[1], mainNum[1], questionToDelete.parent_question_id]
            );
            console.log('✅ Parent reverted back to main question format');
          }
        }
      }
    }

    // Delete the question
    console.log('💾 Deleting from database...');
    await query(
      `DELETE FROM exam_paper_questions WHERE ${whereClause}`,
      whereParams
    );

    // Decrement usage count
    await query(
      'UPDATE questions SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = ?',
      [questionToDelete.question_id]
    );

    console.log('✅ Question removed successfully');

    return NextResponse.json({
      success: true,
      message: 'Question removed from paper successfully',
      sub_questions_deleted: subQuestions.length
    });
  } catch (error) {
    console.error('❌ DELETE /api/exam-papers/[paperId]/questions error:', error);
    return NextResponse.json(
      { error: 'Failed to remove question from paper', details: String(error) },
      { status: 500 }
    );
  }
}