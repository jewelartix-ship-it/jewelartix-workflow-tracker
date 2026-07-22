import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client.js';
import { tasks, auditLog, users } from '../db/schema.js';
import { createTaskSchema, updateTaskSchema, categorySchema } from '../validators/schemas.js';
import { requireAdminPassword } from '../middleware/requireAdminPassword.js';
import { ApiError } from '../lib/errors.js';
import { recordTaskChanges } from '../lib/audit.js';
import { computeWorkStatus } from '../lib/workStatus.js';

// No login system: every request is treated as the shared team account.
// createdBy/updatedBy are left null rather than tied to any one signed-in
// person, since there is no per-person session anymore.
export const tasksRouter = Router();

function withStatus(task: typeof tasks.$inferSelect) {
  return { ...task, workStatus: computeWorkStatus(task) };
}

/** GET /api/tasks?category=CLIENT — every non-deleted row for one category. */
tasksRouter.get('/', async (req, res, next) => {
  try {
    const category = categorySchema.parse(req.query.category);
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.category, category), isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.date), desc(tasks.createdAt));
    res.json(rows.map(withStatus));
  } catch (err) {
    next(err);
  }
});

/** GET /api/tasks/summary — counts per category, used by the Home page cards. */
tasksRouter.get('/summary', async (_req, res, next) => {
  try {
    const rows = await db.select().from(tasks).where(isNull(tasks.deletedAt));
    const summary: Record<string, { total: number; pending: number; completed: number }> = {
      CLIENT: { total: 0, pending: 0, completed: 0 },
      COLLECTION: { total: 0, pending: 0, completed: 0 },
      THEMATIQUE: { total: 0, pending: 0, completed: 0 },
      SPA: { total: 0, pending: 0, completed: 0 },
    };
    for (const row of rows) {
      const bucket = summary[row.category];
      bucket.total += 1;
      if (computeWorkStatus(row) === 'COMPLETED') bucket.completed += 1;
      else bucket.pending += 1;
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

/** GET /api/tasks/:id/audit — change history for one task (Settings / debugging). */
tasksRouter.get('/:id/audit', async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: auditLog.id,
        field: auditLog.field,
        oldValue: auditLog.oldValue,
        newValue: auditLog.newValue,
        changedAt: auditLog.changedAt,
        userName: users.name,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(eq(auditLog.taskId, req.params.id))
      .orderBy(desc(auditLog.changedAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/** POST /api/tasks — create (Add button / popup). */
tasksRouter.post('/', requireAdminPassword, async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const now = new Date();
    const row: typeof tasks.$inferInsert = {
      id: randomUUID(),
      ...data,
      driveLink: data.driveLink || null,
      cadDriveLink: data.cadDriveLink || null,
      renderDriveLink: data.renderDriveLink || null,
      createdBy: null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    };
    const [created] = await db.insert(tasks).values(row).returning();
    res.status(201).json(withStatus(created));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id — partial update.
 * Powers three different UI interactions with the same endpoint:
 *   - a checkbox toggle (body = { cadDone: true })
 *   - an inline double-click edit (body = { note: "..." })
 *   - the full Add/Edit popup save (body = every field)
 */
tasksRouter.patch('/:id', requireAdminPassword, async (req, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, req.params.id)).limit(1);
    if (!existing || existing.deletedAt) throw ApiError.notFound('Task not found');

    const patch: Partial<typeof tasks.$inferInsert> = {
      ...data,
      ...(data.driveLink !== undefined ? { driveLink: data.driveLink || null } : {}),
      ...(data.cadDriveLink !== undefined ? { cadDriveLink: data.cadDriveLink || null } : {}),
      ...(data.renderDriveLink !== undefined ? { renderDriveLink: data.renderDriveLink || null } : {}),
      updatedBy: null,
      updatedAt: new Date(),
    };

    const [updated] = await db.update(tasks).set(patch).where(eq(tasks.id, req.params.id)).returning();
    await recordTaskChanges(req.params.id, null, existing, updated);

    res.json(withStatus(updated));
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/tasks/:id — soft delete (row disappears from the table instantly, recoverable in the DB). */
tasksRouter.delete('/:id', requireAdminPassword, async (req, res, next) => {
  try {
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, req.params.id)).limit(1);
    if (!existing || existing.deletedAt) throw ApiError.notFound('Task not found');

    const deletedAt = new Date();
    await db.update(tasks).set({ deletedAt, updatedBy: null }).where(eq(tasks.id, req.params.id));
    await recordTaskChanges(req.params.id, null, { deletedAt: null }, { deletedAt });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
