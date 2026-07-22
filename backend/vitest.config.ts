import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_PATH: ':memory:',
      JWT_SECRET: 'test-only-secret-not-for-production',
      JWT_EXPIRES_IN: '8h',
      CORS_ORIGIN: 'http://localhost:5173',
    },
    testTimeout: 10000,
  },
});
