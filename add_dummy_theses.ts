
import { query } from './src/lib/db';

async function addMissingTheses() {
  try {
    // 1. Get all candidates who could be scheduled (excluding those who already have one)
    const candidates = await query<any[]>(
      `SELECT id, registration_number FROM phd_candidates 
       WHERE status IN ('thesis_submitted', 'enrolled', 'corrections_pending', 'corrections_submitted')
       AND id NOT IN (SELECT candidate_id FROM thesis_submissions)`
    );

    console.log(`Found ${candidates.length} candidates without thesis submissions.`);

    for (const c of candidates) {
      console.log(`Adding dummy thesis for candidate ${c.registration_number} (ID: ${c.id})`);
      await query(
        `INSERT INTO thesis_submissions (candidate_id, file_name, file_path, version, submitted_at)
         VALUES (?, ?, ?, 1, NOW())`,
        [c.id, 'Draft_Thesis.pdf', '/uploads/theses/draft.pdf']
      );
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error adding theses:', error);
  }
}

addMissingTheses();
