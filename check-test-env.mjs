#!/usr/bin/env node
// scripts/check-test-env.mjs
// Run before tests: node scripts/check-test-env.mjs
// Checks that everything needed for integration tests is in place.

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.test'), override: true });

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const RESET = '\x1b[0m';

let allGood = true;

function ok(msg)   { console.log(`${GREEN}  ✓${RESET} ${msg}`); }
function fail(msg) { console.log(`${RED}  ✗${RESET} ${msg}`); allGood = false; }
function warn(msg) { console.log(`${YELLOW}  ⚠${RESET} ${msg}`); }

console.log('\n🔍 Checking test environment...\n');

// 1. Check .env.test exists and has right values
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  fail('NEXT_PUBLIC_SUPABASE_URL not set in .env.test');
} else if (url.includes('supabase.co')) {
  fail(`NEXT_PUBLIC_SUPABASE_URL points to PRODUCTION: ${url}`);
  warn('  → Change it to: http://localhost:54321');
} else {
  ok(`Supabase URL: ${url}`);
}

if (!anon || anon.includes('REPLACE_WITH')) {
  fail('NEXT_PUBLIC_SUPABASE_ANON_KEY not set — run `supabase status` and copy the Publishable key');
} else if (!anon.startsWith('sb_publishable_') && !anon.startsWith('eyJ')) {
  warn('Anon key format unexpected — should start with sb_publishable_ or eyJ (JWT)');
} else {
  ok(`Anon key set (${anon.slice(0, 20)}...)`);
}

if (!service || service.includes('REPLACE_WITH') || service === 'your-service-role-key-here') {
  fail('SUPABASE_SERVICE_ROLE_KEY not set — run `supabase status` and copy the Secret key');
} else if (!service.startsWith('sb_secret_') && !service.startsWith('eyJ')) {
  warn('Service key format unexpected — should start with sb_secret_ or eyJ (JWT)');
} else {
  ok(`Service role key set (${service.slice(0, 15)}...)`);
}

// 2. Check we can reach local Supabase
if (url && anon && !url.includes('supabase.co')) {
  try {
    const client = createClient(url, anon);
    const { error } = await client.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      fail(`Cannot query local Supabase: ${error.message}`);
      warn('  → Is supabase running? Try: supabase start');
    } else {
      ok('Local Supabase reachable and users table exists');
    }
  } catch (e) {
    fail(`Cannot connect to local Supabase: ${e.message}`);
    warn('  → Run: supabase start');
  }
}

// 3. Check Next.js server is running
try {
  const res = await fetch('http://localhost:3000/api/auth/me', { method: 'GET' });
  if (res.status === 401 || res.status === 200) {
    ok('Next.js server is running on localhost:3000');
  } else {
    warn(`Next.js returned unexpected status ${res.status} — server may still be starting`);
  }
} catch {
  fail('Next.js server is NOT running on localhost:3000');
  warn('  → In another terminal run: npm run dev');
  warn('  → Then re-run this check');
}

// Summary
console.log('');
if (allGood) {
  console.log(`${GREEN}✅ All checks passed — run: npm test${RESET}\n`);
} else {
  console.log(`${RED}❌ Fix the issues above before running tests${RESET}\n`);
  process.exit(1);
}