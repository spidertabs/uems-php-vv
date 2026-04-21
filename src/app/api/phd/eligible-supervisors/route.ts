/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getEligibleSupervisors } from '@/lib/phd/candidates';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const deptId = req.nextUrl.searchParams.get('dept_id');
    const users = await getEligibleSupervisors(deptId ? parseInt(deptId) : undefined);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching eligible supervisors:', error);
    return NextResponse.json({ error: 'Failed to fetch supervisors' }, { status: 500 });
  }
}
