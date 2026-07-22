import path from 'node:path';
import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { db } from './client.js';
import { users, tasks, auditLog } from './schema.js';
import { logger } from '../logger.js';

// Neon (unlike a local SQLite file) has no single file to copy. Instead this
// exports every table to one JSON file — portable, human-readable, and
// restorable into any Postgres database via a small script if ever needed.
// Neon's own point-in-time restore (available even on the free tier, with a
// retention window) is a second, independent safety net on top of this.
const BACKUP_DIR = path.resolve('data/backups');
const RETENTION_DAYS = 14;

mkdirSync(BACKUP_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const dest = path.join(BACKUP_DIR, `app-${stamp}.json`);

const [allUsers, allTasks, allAuditLog] = await Promise.all([
  db.select().from(users),
  db.select().from(tasks),
  db.select().from(auditLog),
]);

// passwordHash is intentionally excluded — this backup is meant to be safe
// to store/share for data-recovery purposes, not a credentials dump. If a
// user needs restoring, reset their password via Settings afterward.
const safeUsers = allUsers.map(({ passwordHash: _passwordHash, ...rest }) => rest);

writeFileSync(
  dest,
  JSON.stringify({ exportedAt: new Date().toISOString(), users: safeUsers, tasks: allTasks, auditLog: allAuditLog }, null, 2)
);
logger.info(`Backup written to ${dest}`);

// Retention: delete backups older than RETENTION_DAYS so the folder doesn't
// grow forever.
const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
for (const file of readdirSync(BACKUP_DIR)) {
  if (!file.startsWith('app-') || !file.endsWith('.json')) continue;
  const full = path.join(BACKUP_DIR, file);
  if (statSync(full).mtimeMs < cutoff) {
    unlinkSync(full);
    logger.info(`Deleted old backup: ${file}`);
  }
}
