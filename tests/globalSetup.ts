// tests/globalSetup.ts
// Runs ONCE before all tests, in the main Node process.
// Loads .env.test into process.env using only Node built-ins (no dotenv needed).
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default function setup() {
  const envFile = resolve(process.cwd(), '.env.test');

  if (!existsSync(envFile)) {
    throw new Error(
      '🚨 .env.test not found!\n' +
      '   Create it in your project root — see TESTING_README.md'
    );
  }

  // Parse .env file manually — handles KEY=value and KEY="value" and comments
  const lines = readFileSync(envFile, 'utf-8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;          // skip blanks/comments
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, ''); // strip quotes
    if (key && !(key in process.env)) {
      process.env[key] = val;                             // don't override existing vars
    }
  }

  // Guard: refuse to run if pointed at production
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (url.includes('supabase.co')) {
    throw new Error(
      '🚨 Tests are pointed at PRODUCTION Supabase!\n' +
      `   URL: ${url}\n` +
      '   Fix: set NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 in .env.test'
    );
  }

  if (!url) {
    throw new Error(
      '🚨 NEXT_PUBLIC_SUPABASE_URL is empty in .env.test!\n' +
      '   Set it to: http://127.0.0.1:54321'
    );
  }
}