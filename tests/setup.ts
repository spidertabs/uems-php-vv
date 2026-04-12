// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret-key',
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'uems_test', // separate test DB
});

beforeAll(async () => {
  // any global setup
});

afterAll(async () => {
  // any global teardown
});