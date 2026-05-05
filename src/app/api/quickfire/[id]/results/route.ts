import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAssessmentById, getAssessmentResults } from '@/lib/quickfire';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: rawId } = await params;
    const assessmentId = parseInt(rawId);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: `Invalid Assessment ID: ${rawId}` }, { status: 400 });
    }

    const assessment = await getAssessmentById(assessmentId);

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.lecturer_id !== user.id && !['hod', 'dean', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const results = await getAssessmentResults(assessmentId);
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
