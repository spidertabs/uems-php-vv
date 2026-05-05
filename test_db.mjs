import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL, !!process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('quickfire_assessments').select('*').limit(1);
  console.log(data, error);
}
run();
