import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Users — every person who can log in.
 * Two roles only: ADMIN (owner/manager, sees Settings) and EMPLOYEE (everyone else).
 * There is no self-registration; accounts are created by an admin from Settings
 * or by the seed script on first install.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'EMPLOYEE'] }).notNull().default('EMPLOYEE'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Tasks — one row per job, shared shape across all four categories
 * (Client / Collection / Thematique / SPA). `category` is what separates them,
 * not four separate tables, since the structure is 100% identical.
 *
 * `workStatus` is intentionally NOT a column: it is always derived from the
 * seven boolean progress flags (see lib/workStatus.ts) so it can never drift
 * out of sync with the checkboxes a user actually ticks.
 *
 * Pipeline order: CAD Done (JewelArtix) -> Preview Sent (JewelArtix) ->
 * CAD Confirm (client) -> STL Send (JewelArtix) -> Render Req. (client) ->
 * Render Photos (JewelArtix) -> Render Videos (JewelArtix).
 *
 * `reason` backs the per-category "Reason" tab: any task with a non-empty
 * reason shows up there. It is not part of the finalized Table/Popup fields,
 * so it lives as an extra optional column rather than a new entity.
 *
 * `deletedAt` implements soft delete: the toolbar's Delete button hides a row
 * instantly (matching the spec) while leaving a recovery path at the database
 * level in case of a mis-click.
 */
export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    category: text('category', { enum: ['CLIENT', 'COLLECTION', 'THEMATIQUE', 'SPA'] }).notNull(),

    // Basic Information (popup)
    date: text('date').notNull(), // ISO date string, e.g. "2026-07-16"
    sr: text('sr').notNull(),
    lot: text('lot').notNull(),
    fileName: text('file_name').notNull(),

    // Progress (popup / table checkboxes) — seven-stage pipeline, in order.
    // Tri-state: null = blank/not yet decided (the default for new tasks),
    // true = done, false = explicitly marked not done. No default value here
    // deliberately — omitting a value on insert leaves it null in Postgres.
    cadDone: boolean('cad_done'),
    previewSent: boolean('preview_sent'),
    cadConfirm: boolean('cad_confirm'),
    stlSend: boolean('stl_send'),
    renderReq: boolean('render_req').notNull().default(false),
    renderPhotos: boolean('render_photos'),
    renderVideos: boolean('render_videos'),

    // Drive columns: separate links for CAD files and render files.
    // `driveLink` (below) is the original single field — kept in the
    // database, unused, rather than dropped, to avoid another migration.
    cadDriveLink: text('cad_drive_link'),
    renderDriveLink: text('render_drive_link'),
    driveLink: text('drive_link'),

    // Notes (inline double-click editable)
    note: text('note'),

    // Reason tab (inline double-click editable, not shown in the main table)
    reason: text('reason'),

    // Audit / bookkeeping
    createdBy: text('created_by').references(() => users.id),
    updatedBy: text('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    categoryIdx: index('tasks_category_idx').on(table.category),
    srIdx: index('tasks_sr_idx').on(table.sr),
    lotIdx: index('tasks_lot_idx').on(table.lot),
  })
);

/**
 * Audit log — field-level history of every change made to a task.
 * This is what turns "employees forget updates" into something visible and
 * traceable, without building a whole separate activity-feed subsystem.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id),
    field: text('field').notNull(),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    changedAt: timestamp('changed_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index('audit_log_task_idx').on(table.taskId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type AuditEntry = typeof auditLog.$inferSelect;
