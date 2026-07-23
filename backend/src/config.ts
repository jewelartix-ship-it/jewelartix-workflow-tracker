import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'change-this-admin-password',
  viewPassword: process.env.VIEW_PASSWORD ?? 'change-this-view-password',
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME ?? 'Admin',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@yourcompany.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'change-this-password',
  },
} as const;
