import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from '../config.js';
import * as schema from './schema.js';

// neon-http is an HTTP-based driver (one request = one query over HTTPS) —
// deliberately chosen over a pooled TCP driver because it has zero
// connection-setup cost, which is exactly what serverless functions need:
// each invocation is short-lived and there's no long-running process to
// hold a connection pool open between requests.
const sql = neon(config.databaseUrl);

export const db = drizzle(sql, { schema });
