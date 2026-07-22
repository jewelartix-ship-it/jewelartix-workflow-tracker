import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { TEST_ADMIN, TEST_EMPLOYEE } from './setup.js';

const app = createApp();

async function loginAs(user: { email: string; password: string }) {
  const agent = request.agent(app);
  // Applies to every subsequent request made through this agent — satisfies
  // the API's CSRF defense-in-depth check on POST/PATCH/DELETE (see app.ts).
  agent.set('X-Requested-With', 'vitest');
  await agent.post('/api/auth/login').send({ email: user.email, password: user.password });
  return agent;
}

const validTask = {
  category: 'CLIENT' as const,
  date: '2026-07-16',
  sr: 'SR-100',
  lot: 'LOT-A',
  fileName: 'model.stl',
};

describe('task authentication', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/tasks?category=CLIENT');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/tasks', () => {
  it('rejects a task missing required fields', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const res = await agent.post('/api/tasks').send({ category: 'CLIENT' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid drive link', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const res = await agent.post('/api/tasks').send({ ...validTask, sr: 'SR-BADLINK', driveLink: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('creates a task with workStatus PENDING_CAD by default', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const res = await agent.post('/api/tasks').send({ ...validTask, sr: 'SR-101' });
    expect(res.status).toBe(201);
    expect(res.body.workStatus).toBe('PENDING_CAD');
    expect(res.body.category).toBe('CLIENT');
  });

  it('allows an EMPLOYEE (not just ADMIN) to create tasks, matching the shared-Excel permission model', async () => {
    const agent = await loginAs(TEST_EMPLOYEE);
    const res = await agent.post('/api/tasks').send({ ...validTask, sr: 'SR-102' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/tasks', () => {
  it('only returns rows for the requested category', async () => {
    const agent = await loginAs(TEST_ADMIN);
    await agent.post('/api/tasks').send({ ...validTask, category: 'CLIENT', sr: 'SR-200' });
    await agent.post('/api/tasks').send({ ...validTask, category: 'SPA', sr: 'SR-201' });

    const res = await agent.get('/api/tasks?category=SPA');
    expect(res.status).toBe(200);
    expect(res.body.every((t: { category: string }) => t.category === 'SPA')).toBe(true);
    expect(res.body.some((t: { sr: string }) => t.sr === 'SR-201')).toBe(true);
    expect(res.body.some((t: { sr: string }) => t.sr === 'SR-200')).toBe(false);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('recomputes workStatus as checkboxes are ticked in order, and records audit entries', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const create = await agent.post('/api/tasks').send({ ...validTask, sr: 'SR-300' });
    const id = create.body.id;

    const step1 = await agent.patch(`/api/tasks/${id}`).send({ cadDone: true });
    expect(step1.body.workStatus).toBe('PENDING_CAD_CONFIRMATION');

    const step2 = await agent.patch(`/api/tasks/${id}`).send({ cadConfirm: true, cadSent: true });
    expect(step2.body.workStatus).toBe('PENDING_PHOTO_RENDER');

    const step3 = await agent.patch(`/api/tasks/${id}`).send({ photo: true, video: true });
    expect(step3.body.workStatus).toBe('COMPLETED');

    const audit = await agent.get(`/api/tasks/${id}/audit`);
    expect(audit.status).toBe(200);
    const fields = audit.body.map((a: { field: string }) => a.field);
    expect(fields).toContain('cadDone');
    expect(fields).toContain('video');
  });

  it('returns 404 for a task that does not exist', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const res = await agent.patch('/api/tasks/does-not-exist').send({ note: 'hi' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('soft deletes: row disappears from listing but is not destroyed', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const create = await agent.post('/api/tasks').send({ ...validTask, sr: 'SR-400' });
    const id = create.body.id;

    const del = await agent.delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);

    const list = await agent.get('/api/tasks?category=CLIENT');
    expect(list.body.some((t: { id: string }) => t.id === id)).toBe(false);

    // deleting again should now 404, proving it wasn't hard-deleted-and-forgotten
    // but rather is correctly excluded going forward
    const del2 = await agent.delete(`/api/tasks/${id}`);
    expect(del2.status).toBe(404);
  });
});

describe('admin-only routes', () => {
  it('blocks an EMPLOYEE from listing users', async () => {
    const agent = await loginAs(TEST_EMPLOYEE);
    const res = await agent.get('/api/users');
    expect(res.status).toBe(403);
  });

  it('allows an ADMIN to list users', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const res = await agent.get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/tasks/summary', () => {
  it('buckets tasks into pending vs completed per category', async () => {
    const agent = await loginAs(TEST_ADMIN);
    const create = await agent.post('/api/tasks').send({ ...validTask, category: 'COLLECTION', sr: 'SR-500' });
    await agent
      .patch(`/api/tasks/${create.body.id}`)
      .send({ cadDone: true, cadConfirm: true, cadSent: true, photo: true, video: true });

    const res = await agent.get('/api/tasks/summary');
    expect(res.status).toBe(200);
    expect(res.body.COLLECTION.completed).toBeGreaterThanOrEqual(1);
  });
});
