import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { deleteQuestion, updateQuestion } from '@/lib/quickfire';
import { query } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: rawId } = await params;
    const qId = parseInt(rawId);
    if (isNaN(qId)) {
      return NextResponse.json({ error: `Invalid Question ID: ${rawId}` }, { status: 400 });
    }

    // Verify ownership or check if admin
    const questionCheck = await query(
      `SELECT qa.lecturer_id FROM quickfire_questions qq
       JOIN quickfire_assessments qa ON qq.assessment_id = qa.id
       WHERE qq.id = ?`,
      [qId]
    ) as any[];

    if (questionCheck.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (questionCheck[0].lecturer_id !== user.id && !['admin'].includes(user.role)) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteQuestion(qId);
    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: rawId } = await params;
    const qId = parseInt(rawId);
    if (isNaN(qId)) {
      return NextResponse.json({ error: `Invalid Question ID: ${rawId}` }, { status: 400 });
    }

    // Verify ownership or check if admin
    const questionCheck = await query(
      `SELECT qa.lecturer_id FROM quickfire_questions qq
       JOIN quickfire_assessments qa ON qq.assessment_id = qa.id
       WHERE qq.id = ?`,
      [qId]
    ) as any[];

    if (questionCheck.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (questionCheck[0].lecturer_id !== user.id && !['admin'].includes(user.role)) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    await updateQuestion(qId, body);

    return NextResponse.json({ success: true, message: 'Question updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
