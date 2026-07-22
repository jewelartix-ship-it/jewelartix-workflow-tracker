import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// The app shell always calls GET /api/auth/me on load to check for a session.
// In these tests there's no real backend, so simulate "not signed in" by
// default; individual tests can override global.fetch for other cases.
beforeEachSetupFetchMock();

function beforeEachSetupFetchMock() {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Not signed in' } }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  ) as unknown as typeof fetch;
}
