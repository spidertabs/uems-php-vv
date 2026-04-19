// tests/setup.ts
// Per-test-file setup. Env vars are already loaded by tests/globalSetup.ts
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  console.log('\n🧪 Test environment:');
  console.log(`   Supabase : ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   App      : ${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}`);
  console.log(`   NODE_ENV : ${process.env.NODE_ENV}\n`);
});

afterAll(async () => {
  console.log('\n✅ Test session completed\n');
});