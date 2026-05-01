
import { query } from './src/lib/db';

async function testInsert() {
  const candidate_id = 46;
  const thesis_id = 39;
  const scheduled_date = '2026-12-05';
  const scheduled_time = '15:59';
  const venue = 'Main Library';
  const duration_minutes = 90;
  const userId = 1;

  try {
    console.log('Testing exact query from route.ts');
    
    const result = await query<any>(
      `INSERT INTO viva_schedules 
       (candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?::date, ?::time, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes, userId]
    );
    console.log('Insert Result:', result);
    
    // Audit log simulation
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
       VALUES (?, 'CREATE', 'viva_schedules', ?, CAST(? AS jsonb), NOW())`,
      [userId, (result as any).insertId, JSON.stringify({ candidate_id, thesis_id, scheduled_date, scheduled_time, venue, duration_minutes })]
    );
    console.log('Audit log inserted.');

    // Cleanup
    if (result.insertId) {
       await query('DELETE FROM viva_schedules WHERE id = ?', [result.insertId]);
       console.log('Cleaned up.');
    }
    
  } catch (e: any) {
    console.error('🔥 ERROR:', e.message);
    if (e.stack) console.error(e.stack);
  }
}

testInsert();
