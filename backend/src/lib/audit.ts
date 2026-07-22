import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';
import { auditLog } from '../db/schema.js';

// Fields we never want cluttering the audit trail — bookkeeping columns that
// change on every save regardless of what the user actually edited.
const IGNORED_FIELDS = new Set(['updatedAt', 'updatedBy', 'createdAt', 'createdBy', 'id']);

function serialize(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/**
 * Compares two flat objects field by field and writes one audit_log row per
 * field that actually changed. Called after every task create/update/delete.
 */
export async function recordTaskChanges(
  taskId: string,
  userId: string | null,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Promise<void> {
  const fields = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const rows: (typeof auditLog.$inferInsert)[] = [];

  for (const field of fields) {
    if (IGNORED_FIELDS.has(field)) continue;
    const oldValue = serialize(before?.[field]);
    const newValue = serialize(after?.[field]);
    if (oldValue === newValue) continue;

    rows.push({
      id: randomUUID(),
      taskId,
      userId,
      field,
      oldValue,
      newValue,
      changedAt: new Date(),
    });
  }

  if (rows.length > 0) {
    await db.insert(auditLog).values(rows);
  }
}
