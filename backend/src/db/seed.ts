import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { users } from './schema.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

// This seed intentionally creates ONLY the first admin login — no sample
// tasks. The app ships with zero task rows; real data is entered by staff or
// brought in once via scripts/migrate-excel.ts.
const [existing] = await db.select().from(users).where(eq(users.email, config.seedAdmin.email)).limit(1);

if (existing) {
  logger.info(`Admin account ${config.seedAdmin.email} already exists, skipping seed.`);
} else {
  await db.insert(users).values({
    id: randomUUID(),
    name: config.seedAdmin.name,
    email: config.seedAdmin.email,
    passwordHash: bcrypt.hashSync(config.seedAdmin.password, 12),
    role: 'ADMIN',
    active: true,
  });
  logger.info(`Created admin account: ${config.seedAdmin.email}`);
  logger.warn('Sign in and change this password immediately — it was set from SEED_ADMIN_PASSWORD in .env');
}
