
import { query } from './src/lib/db';

async function check() {
  try {
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'viva_schedules'
    `);
    console.log('Indexes:', JSON.stringify(indexes, null, 2));
    
    // Also check if there are any triggers that might be Raising an exception if a schedule already exists
    const triggers = await query(`
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'viva_schedules'
    `);
    console.log('Triggers:', JSON.stringify(triggers, null, 2));
  } catch (e) {
    console.error(e);
  }
}

check();
