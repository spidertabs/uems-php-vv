import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { assignSupervisor } from '@/lib/exams';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { timetableId: string } }) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const data = await query(
      `SELECT s.id, s.first_name, s.last_name, s.email, es.assigned_at
       FROM exam_supervisors es
       JOIN staff s ON es.lecturer_id = s.id
       WHERE es.timetable_id = ?`,
      [params.timetableId]
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'hod' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { timetable_id, lecturer_id } = await request.json();

    if (!timetable_id || !lecturer_id) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    await assignSupervisor(timetable_id, lecturer_id);

    return NextResponse.json({ success: true, message: 'Supervisor assigned' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
