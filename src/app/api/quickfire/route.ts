import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAssessmentsByLecturer, createAssessment } from '@/lib/quickfire';

/**
 * GET /api/quickfire
 * Returns all assessments owned by the authenticated lecturer
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['lecturer', 'hod', 'dean', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assessments = await getAssessmentsByLecturer(user.id);
    return NextResponse.json({ success: true, data: assessments });
  } catch (error: any) {
    console.error('Quickfire GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/quickfire
 * Creates a new assessment
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['lecturer', 'hod', 'dean', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const assessmentData = {
      ...body,
      lecturer_id: user.id
    };

    if (!assessmentData.course_id || !assessmentData.title) {
      return NextResponse.json({ error: 'Course ID and Title are required' }, { status: 400 });
    }

    const insertId = await createAssessment(assessmentData);
    return NextResponse.json({ success: true, data: { id: insertId } }, { status: 201 });
  } catch (error: any) {
    console.error('Quickfire POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
