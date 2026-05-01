
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
  const userId = 1;

  try {
    console.log('Attempting insert with:', body);
    
    const result = await query<any>(
      `INSERT INTO viva_schedules 
       (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?::date, ?::time, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [body.candidate_id, body.thesis_id, body.scheduled_date, body.scheduled_time, body.venue, body.duration_minutes, userId]
    );
    console.log('Insert Result:', result);
    
    if (result.insertId) {
       console.log('Successfully inserted ID:', result.insertId);
       // Clean up
       await query('DELETE FROM viva_schedules WHERE id = ?', [result.insertId]);
       console.log('Cleaned up.');
    }
    
  } catch (e: any) {
    console.error('ERROR DETECTED:', e.message);
    if (e.stack) console.error(e.stack);
  }
}

testInsert();
