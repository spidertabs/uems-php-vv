// src/app/api/courses/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/courses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  // If using Next.js 16 App Router, unwrap Promise if needed
  const resolvedParams = params instanceof Promise ? await params : params;
  const courseId = parseInt(resolvedParams.id, 10);

  try {
    // Fetch course details including department, college, and HOD
    const [course] = await query<any[]>(
      `SELECT 
          c.*,
          d.name AS department_name,
          col.name AS college_name,
          col.code AS college_code,
          CONCAT(u.first_name, ' ', u.last_name) AS hod_name
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN colleges col ON d.college_id = col.id
       LEFT JOIN staff u ON u.department_id = d.id AND u.role = 'hod'
       WHERE c.id = ?
       LIMIT 1`,
      [courseId]
    );

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}

