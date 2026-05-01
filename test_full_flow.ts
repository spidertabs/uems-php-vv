
import { query } from './src/lib/db';
import { notifyVivaScheduled } from './src/lib/phd/notifications';

async function testFullFlow() {
  const candidate_id = 46;
  const thesis_id = 39;
  const scheduled_date = '2026-12-05';
  const scheduled_time = '15:59';
  const venue = 'Main Library';
  const duration_minutes = 90;
  const userId = 1;

  try {
    console.log('--- Phase 1: Insert Viva Schedule ---');
    const result = await query<any>(
      `INSERT INTO viva_schedules 
       (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?::date, ?::time, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, userId]
    );
    const vivaId = result.insertId;
    console.log('Result:', result);

    console.log('--- Phase 2: Notify ---');
    await notifyVivaScheduled(vivaId);
    console.log('Notifications sent.');

    console.log('--- Phase 3: Cleanup ---');
    await query('DELETE FROM viva_schedules WHERE id = ?', [vivaId]);
    console.log('Cleaned up.');

  } catch (e: any) {
    console.error('🔥 FAILED:', e.message);
    if (e.stack) console.error(e.stack);
  }
}

testFullFlow();
