import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { TEST_ADMIN } from './setup.js';

const app = createApp();

describe('POST /api/auth/login', () => {
  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' });
    expect(res.status).toBe(401);
  });

  it('rejects the wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects a malformed request body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials and sets an httpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_ADMIN.email);
    expect(res.body).not.toHaveProperty('passwordHash');

    const cookie = res.headers['set-cookie']?.[0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });
});

describe('GET /api/auth/me', () => {
  it('rejects requests with no session cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user when signed in', async () => {
    const agent = request.agent(app);
    agent.set('X-Requested-With', 'vitest');
    await agent.post('/api/auth/login').send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_ADMIN.email);
    expect(res.body.role).toBe('ADMIN');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so a subsequent /me is rejected', async () => {
    const agent = request.agent(app);
    agent.set('X-Requested-With', 'vitest');
    await agent.post('/api/auth/login').send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    await agent.post('/api/auth/logout').expect(204);

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
