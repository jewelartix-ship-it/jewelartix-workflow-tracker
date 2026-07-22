import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { auditLog, users, tasks } from '../db/schema.js';

export const auditRouter = Router();

/** GET /api/audit/recent — last 50 changes across all tasks, for Settings > Recent Activity. */
auditRouter.get('/recent', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: auditLog.id,
        field: auditLog.field,
        oldValue: auditLog.oldValue,
        newValue: auditLog.newValue,
        changedAt: auditLog.changedAt,
        userName: users.name,
        taskFileName: tasks.fileName,
        taskCategory: tasks.category,
        taskId: tasks.id,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .leftJoin(tasks, eq(auditLog.taskId, tasks.id))
      .orderBy(desc(auditLog.changedAt))
      .limit(50);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
