import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { loginSchema, adminPasswordSchema } from '../validators/schemas.js';
import { signSession } from '../lib/jwt.js';
import { ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';

export const authRouter = Router();

// Slow down brute-force guessing without needing an external service.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Try again in 15 minutes.' } },
});

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
  maxAge: 8 * 60 * 60 * 1000, // 8h, mirrors JWT_EXPIRES_IN default
  path: '/',
};

/**
 * POST /api/auth/verify-admin — checks the one shared admin password (not
 * tied to any user account) and just says yes/no. The frontend remembers the
 * result in sessionStorage and sends the same password back as a header
 * (X-Admin-Password) on every edit/add/delete request afterward; the backend
 * checks it again there (see middleware/requireAdminPassword.ts) rather than
 * trusting the frontend's memory of a prior successful check.
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Try again in 15 minutes.' } },
});

authRouter.post('/verify-admin', adminLimiter, (req, res, next) => {
  try {
    const { password } = adminPasswordSchema.parse(req.body);
    if (password !== config.adminPassword) throw ApiError.unauthorized('Incorrect admin password');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.active) throw ApiError.unauthorized('Incorrect email or password');

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Incorrect email or password');

    const token = signSession({ userId: user.id, role: user.role });
    res.cookie('token', token, cookieOptions);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.status(204).send();
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    if (!user || !user.active) throw ApiError.unauthorized();
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/auto-login — no password system. There is no login form in
 * this app: every visitor is silently signed in as the single shared team
 * account (config.seedAdmin.email), created once by the seed script. This
 * exists so createdBy/updatedBy/audit-log attribution and the Settings page
 * keep working exactly as before, without anyone ever typing a password.
 */
authRouter.post('/auto-login', async (_req, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, config.seedAdmin.email)).limit(1);
    if (!user || !user.active) throw ApiError.unauthorized('Shared account not found — run /api/_setup first.');

    const token = signSession({ userId: user.id, role: user.role });
    res.cookie('token', token, cookieOptions);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});
