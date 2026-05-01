
import { query } from './src/lib/db';

async function check() {
  try {
    const candidate = await query('SELECT id, status FROM phd_candidates WHERE registration_number = ?', ['KIU/2024/P201']);
    console.log('Candidate:', candidate);
    if (candidate[0]) {
      const schedules = await query('SELECT * FROM viva_schedules WHERE candidate_id = ?', [candidate[0].id]);
      console.log('Schedules:', schedules);
    }
  } catch (e) {
    console.error(e);
  }
}

check();
