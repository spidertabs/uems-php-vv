import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAssessmentById, getQuestionsByAssessment, addQuestion } from '@/lib/quickfire';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: `Invalid Assessment ID: ${params.id}` }, { status: 400 });
    }
    const questions = await getQuestionsByAssessment(assessmentId);

    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: `Invalid Assessment ID: ${params.id}` }, { status: 400 });
    }
    const assessment = await getAssessmentById(assessmentId);

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.lecturer_id !== user.id && !['admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const questionData = {
      ...body,
      assessment_id: assessmentId
    };

    const insertId = await addQuestion(questionData);
    return NextResponse.json({ success: true, data: { id: insertId } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
