# syntax=docker/dockerfile:1

# ---- 1. Build the frontend (React/Vite) ----
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- 2. Compile the backend (TypeScript -> JS) ----
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/ ./
RUN npm run build
# Migrations (drizzle/*.sql) are generated during development with
# `npm run db:generate` and committed to git — NOT regenerated at build time,
# since that's what makes them a reliable, ordered history of schema changes
# rather than a single snapshot of "whatever the schema looks like today".

# ---- 3. Install production-only backend dependencies ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- 4. Final runtime image ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/drizzle ./drizzle
COPY --from=frontend-build /app/frontend/dist ./public

RUN groupadd -r app && useradd -r -g app app && chown -R app:app /app
USER app

EXPOSE 4000

# Apply any pending DB migrations (against DATABASE_URL, a Postgres/Neon
# connection string — see .env.example), then start the API (which also
# serves the built frontend from ./public — see src/app.ts).
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
