Oimport { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, tasks } from '../db/schema.js';
import { config } from '../config.js';

export const setupRouter = Router();

function checkToken(req: import('express').Request, res: import('express').Response): boolean {
  if (req.query.token !== config.jwtSecret) {
    res.status(403).send('Forbidden — wrong or missing token.');
    return false;
  }
  return true;
}

/**
 * GET /api/_setup?token=YOUR_JWT_SECRET
 *
 * Creates every table directly with plain SQL — deliberately NOT using
 * drizzle-kit's migration files/meta/journal system, which requires several
 * generated files to stay perfectly in sync and has been the source of
 * repeated deploy failures. This is self-contained: one file, one request,
 * nothing else to keep in sync. Every statement is IF NOT EXISTS, so it's
 * safe to run this any number of times.
 */
setupRouter.get('/_setup', async (req, res, next) => {
  try {
    if (!checkToken(req, res)) return;

    const steps: string[] = [];

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text DEFAULT 'EMPLOYEE' NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    steps.push('users table: ok');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" text PRIMARY KEY NOT NULL,
        "category" text NOT NULL,
        "date" text NOT NULL,
        "sr" text NOT NULL,
        "lot" text NOT NULL,
        "file_name" text NOT NULL,
        "cad_done" boolean DEFAULT false NOT NULL,
        "preview_sent" boolean DEFAULT false NOT NULL,
        "cad_confirm" boolean DEFAULT false NOT NULL,
        "stl_send" boolean DEFAULT false NOT NULL,
        "render_req" boolean DEFAULT false NOT NULL,
        "render_photos" boolean DEFAULT false NOT NULL,
        "render_videos" boolean DEFAULT false NOT NULL,
        "drive_link" text,
        "note" text,
        "reason" text,
        "created_by" text,
        "updated_by" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "deleted_at" timestamp
      )
    `);
    steps.push('tasks table: ok');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" text PRIMARY KEY NOT NULL,
        "task_id" text NOT NULL,
        "user_id" text,
        "field" text NOT NULL,
        "old_value" text,
        "new_value" text,
        "changed_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    steps.push('audit_log table: ok');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS "tasks_category_idx" ON "tasks" ("category")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "tasks_sr_idx" ON "tasks" ("sr")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "tasks_lot_idx" ON "tasks" ("lot")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "audit_log_task_idx" ON "audit_log" ("task_id")`);
    steps.push('indexes: ok');

    // Added after initial launch: two separate Drive links (CAD / Render)
    // replacing the single generic one. ADD COLUMN IF NOT EXISTS is safe to
    // run any number of times and won't touch existing data.
    await db.execute(sql`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "cad_drive_link" text`);
    await db.execute(sql`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "render_drive_link" text`);
    steps.push('cad_drive_link / render_drive_link columns: ok');

    // Tri-state progress: blank (null, new default) / done (true) / not done
    // (false), instead of just true/false. DROP NOT NULL and DROP DEFAULT
    // are both safe to run repeatedly — no-ops if already applied. Existing
    // rows keep whatever true/false they already had; only brand-new tasks
    // start blank from now on.
    for (const col of ['cad_done', 'preview_sent', 'cad_confirm', 'stl_send', 'render_photos', 'render_videos']) {
      await db.execute(sql.raw(`ALTER TABLE "tasks" ALTER COLUMN "${col}" DROP NOT NULL`));
      await db.execute(sql.raw(`ALTER TABLE "tasks" ALTER COLUMN "${col}" DROP DEFAULT`));
    }
    steps.push('progress columns: now nullable tri-state (blank/done/not done)');

    const [existing] = await db.select().from(users).where(eq(users.email, config.seedAdmin.email)).limit(1);
    if (existing) {
      steps.push(`admin account: already existed (${config.seedAdmin.email})`);
    } else {
      await db.insert(users).values({
        id: randomUUID(),
        name: config.seedAdmin.name,
        email: config.seedAdmin.email,
        passwordHash: bcrypt.hashSync(config.seedAdmin.password, 12),
        role: 'ADMIN',
        active: true,
      });
      steps.push(`admin account: created (${config.seedAdmin.email})`);
    }

    res.type('text/plain').send(`Setup complete.\n\n${steps.join('\n')}\n\nYou can close this tab now.`);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/_debug?token=YOUR_JWT_SECRET
 * Diagnostic — shows real errors instead of the generic message the UI
 * shows. Delete this route once everything is confirmed working.
 */
setupRouter.get('/_debug', async (req, res) => {
  if (!checkToken(req, res)) return;

  const report: Record<string, unknown> = {};

  report.databaseUrlPresent = Boolean(process.env.DATABASE_URL);

  try {
    await db.execute(sql`select 1 as ok`);
    report.rawConnection = { ok: true };
  } catch (err) {
    report.rawConnection = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const userRows = await db.select().from(users).limit(5);
    report.usersTable = { ok: true, rowCount: userRows.length };
  } catch (err) {
    report.usersTable = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const taskRows = await db.select().from(tasks).limit(5);
    report.tasksTable = { ok: true, rowCount: taskRows.length };
  } catch (err) {
    report.tasksTable = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const testId = randomUUID();
    await db.insert(tasks).values({
      id: testId,
      category: 'CLIENT',
      date: '2026-01-01',
      sr: '__debug_test__',
      lot: '__debug_test__',
      fileName: '__debug_test__',
    });
    await db.delete(tasks).where(eq(tasks.id, testId));
    report.testInsertAndDelete = { ok: true };
  } catch (err) {
    report.testInsertAndDelete = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  res.json(report);
});
