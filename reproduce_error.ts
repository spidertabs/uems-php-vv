
import { query } from './src/lib/db';

async function testInsert() {
  const body = {
    candidate_id: 46,
    thesis_id: 39,
    scheduled_date: '2026-12-05',
    scheduled_time: '15:59',
    venue: 'Main Library',
    duration_minutes: 90,
  };
  const userId = 1; // Assuming admin/coordinator ID 1

  try {
    console.log('Attempting insert with:', body);
    
    // Mimic the POST behavior
    const result = await query(
      `INSERT INTO viva_schedules 
       (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?::date, ?::time, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [body.candidate_id, body.thesis_id, body.scheduled_date, body.scheduled_time, body.duration_minutes, userId]
    );
    console.log('Insert Result:', result);
    
    const vivaId = (result as any).insertId;
    console.log('Inserted ID:', vivaId);
    
    // Trigger will auto-update candidate status to 'viva_scheduled'
    // This is where it might fail if there's a constraint on phd_candidates or a trigger

    // Notify ...
    // Note: notifyVivaScheduled might fail
    // await notifyVivaScheduled(vivaId);
    
  } catch (e: any) {
    console.error('ERROR DETECTED:', e.message);
    if (e.stack) console.error(e.stack);
  }
}

testInsert();
