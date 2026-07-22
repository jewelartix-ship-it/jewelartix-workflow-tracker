import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../src/db/client.js';
import { users } from '../src/db/schema.js';

migrate(db, { migrationsFolder: './drizzle' });

// Low bcrypt cost here only — this is test-only code, never used in production
// where routes/*.ts always hash at cost 12.
const TEST_BCRYPT_COST = 4;

export const TEST_ADMIN = {
  id: randomUUID(),
  name: 'Test Admin',
  email: 'test-admin@example.com',
  password: 'testpassword123',
};

export const TEST_EMPLOYEE = {
  id: randomUUID(),
  name: 'Test Employee',
  email: 'test-employee@example.com',
  password: 'testpassword123',
};

db.insert(users)
  .values([
    {
      id: TEST_ADMIN.id,
      name: TEST_ADMIN.name,
      email: TEST_ADMIN.email,
      passwordHash: bcrypt.hashSync(TEST_ADMIN.password, TEST_BCRYPT_COST),
      role: 'ADMIN',
    },
    {
      id: TEST_EMPLOYEE.id,
      name: TEST_EMPLOYEE.name,
      email: TEST_EMPLOYEE.email,
      passwordHash: bcrypt.hashSync(TEST_EMPLOYEE.password, TEST_BCRYPT_COST),
      role: 'EMPLOYEE',
    },
  ])
  .run();
