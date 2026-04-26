// src/app/api/phd/eligible-examiners/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getEligibleExaminers } from '@/lib/phd/examiners';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const deptId = req.nextUrl.searchParams.get('dept_id');
    const staff = await getEligibleExaminers(deptId ? parseInt(deptId) : undefined);
    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching eligible examiners:', error);
    return NextResponse.json({ error: 'Failed to fetch examiners' }, { status: 500 });
  }
}
