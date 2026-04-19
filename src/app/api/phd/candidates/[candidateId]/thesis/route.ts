/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifyThesisUploaded } from '@/lib/phd/notifications';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin', 'hod'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { candidateId: candidateIdStr } = await context.params;
    const candidateId = parseInt(candidateIdStr);

    const thesis = await query<any[]>(
      `SELECT id, candidate_id, version, file_name, file_path, file_size_kb, 
              submission_notes, submitted_at
       FROM thesis_submissions
       WHERE candidate_id = ?
       ORDER BY version DESC`,
      [candidateId]
    );

    return NextResponse.json({ submissions: thesis });
  } catch (error) {
    console.error('Error fetching thesis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thesis' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user || !['viva_coordinator', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { candidateId: candidateIdStr } = await context.params;
    const candidateId = parseInt(candidateIdStr);
    const body = await req.json();

    const { file_name, file_path, file_size_kb, submission_notes } = body;

    if (!file_name || !file_path || !file_size_kb) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const candidate = await query<any[]>(
      'SELECT id FROM phd_candidates WHERE id = ?',
      [candidateId]
    );

    if (!candidate || candidate.length === 0) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Insert thesis submission
    // Note: trigger will auto-increment version
    const result = await query<any>(
      `INSERT INTO thesis_submissions 
       (candidate_id, file_name, file_path, file_size_kb, submission_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [candidateId, file_name, file_path, file_size_kb, submission_notes || null]
    );

    // Update candidate status to 'thesis_submitted'
    await query(
      `UPDATE phd_candidates SET status = 'thesis_submitted', updated_at = NOW() WHERE id = ?`,
      [candidateId]
    );

    // Notify all viva coordinators via centralised helper
    const coordinators = await query<any[]>(
      `SELECT id FROM users WHERE role = 'viva_coordinator' AND is_active = TRUE`
    );
    const coordinatorIds = coordinators.map((c) => c.id);
    await notifyThesisUploaded(candidateId, coordinatorIds);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
       VALUES (?, 'CREATE', 'thesis_submissions', ?, CAST(? AS jsonb), NOW())`,
      [user.id, (result as any).insertId, JSON.stringify({ candidate_id: candidateId, file_name, file_path, file_size_kb })]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating thesis submission:', error);
    return NextResponse.json(
      { error: 'Failed to create thesis submission' },
      { status: 500 }
    );
  }
}
