import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './client.js';
import { logger } from '../logger.js';

await migrate(db, { migrationsFolder: './drizzle' });
logger.info('Migrations applied');
