/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getStudentsForCandidateRegistration } from '@/lib/phd/candidates';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const deptId = user.role === 'hod' ? (user.department_id ?? undefined) : undefined;
    const students = await getStudentsForCandidateRegistration(deptId as number | undefined);
    return NextResponse.json({ users: students });
  } catch (error) {
    console.error('Error fetching available users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
