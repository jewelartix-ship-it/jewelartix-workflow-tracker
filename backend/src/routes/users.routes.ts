import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { createUserSchema, updateUserSchema } from '../validators/schemas.js';
import { ApiError } from '../lib/errors.js';

// No login system: Team Members management is open to anyone with the link,
// same as the rest of the app.
export const usersRouter = Router();

function publicUser(u: typeof users.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt };
}

usersRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await db.select().from(users).orderBy(users.name);
    res.json(rows.map(publicUser));
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) throw ApiError.conflict('A user with that email already exists');

    const row: typeof users.$inferInsert = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: bcrypt.hashSync(data.password, 12),
    };
    const [created] = await db.insert(users).values(row).returning();
    res.status(201).json(publicUser(created));
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const [existing] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!existing) throw ApiError.notFound('User not found');

    if (existing.role === 'ADMIN' && data.role === 'EMPLOYEE') {
      const admins = await db.select().from(users).where(eq(users.role, 'ADMIN'));
      if (admins.length <= 1) throw ApiError.badRequest('At least one admin must remain', 'LAST_ADMIN');
    }

    const patch: Partial<typeof users.$inferInsert> = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.password !== undefined ? { passwordHash: bcrypt.hashSync(data.password, 12) } : {}),
    };
    const [updated] = await db.update(users).set(patch).where(eq(users.id, req.params.id)).returning();
    res.json(publicUser(updated));
  } catch (err) {
    next(err);
  }
});

usersRouter.delete('/:id', async (req, res, next) => {
  try {
    const [existing] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!existing) throw ApiError.notFound('User not found');

    // Deactivate rather than hard-delete: preserves the created_by/updated_by
    // history on past tasks and audit_log entries.
    await db.update(users).set({ active: false }).where(eq(users.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
