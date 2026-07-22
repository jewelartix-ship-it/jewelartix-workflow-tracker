import { z } from 'zod';

export const categorySchema = z.enum(['CLIENT', 'COLLECTION', 'THEMATIQUE', 'SPA']);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const adminPasswordSchema = z.object({
  password: z.string().min(1),
});

// Shared by create + update. Basic Information + Progress + Drive + Notes,
// exactly the fields defined in the finalized popup, plus `reason` for the
// Reason tab.
export const taskBaseSchema = z.object({
  category: categorySchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  sr: z.string().trim().min(1, 'SR is required').max(100),
  lot: z.string().trim().min(1, 'Lot is required').max(100),
  fileName: z.string().trim().min(1, 'File name is required').max(255),
  cadDone: z.boolean().optional().default(false),
  previewSent: z.boolean().optional().default(false),
  cadConfirm: z.boolean().optional().default(false),
  stlSend: z.boolean().optional().default(false),
  renderReq: z.boolean().optional().default(false),
  renderPhotos: z.boolean().optional().default(false),
  renderVideos: z.boolean().optional().default(false),
  cadDriveLink: z.union([z.string().trim().url('Must be a valid URL'), z.literal('')]).nullable().optional(),
  renderDriveLink: z.union([z.string().trim().url('Must be a valid URL'), z.literal('')]).nullable().optional(),
  driveLink: z.union([z.string().trim().url('Must be a valid URL'), z.literal('')]).nullable().optional(),
  note: z.string().max(5000).nullable().optional(),
  reason: z.string().max(2000).nullable().optional(),
});

export const createTaskSchema = taskBaseSchema;

// Every field optional for PATCH (checkbox toggles / inline edits only send
// the one field that changed; the popup sends everything it owns).
export const updateTaskSchema = taskBaseSchema.partial();

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
