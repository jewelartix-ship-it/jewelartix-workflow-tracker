# Workflow Tracker

An internal web app that replaces the team's Excel-based job tracker. Same
workflow, same categories, same day-to-day habits — just faster, searchable,
and no more "who forgot to update the sheet."

Built for a team of 10–20 people. Not a CRM, not an ERP — a focused tool for
one job: tracking CAD/render jobs through a fixed pipeline for four
categories (Client, Collection, Thematique, SPA).

```
PDF/3DM from client → JPG → CAD → CAD Confirmed → CAD/STL Sent → Photo Render → Video Render → Done
```

## Full documentation

This README is a quick start. For everything else, see `docs/`:

- **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** — software to install, first-time setup on a fresh
  computer, running the app, environment variables, deployment
- **[docs/OPERATIONS_GUIDE.md](docs/OPERATIONS_GUIDE.md)** — common errors, troubleshooting, folder
  structure, building for production, ongoing maintenance

The same content is also provided as two PDFs for printing/sharing:
`docs/Software-Requirements.pdf` and `docs/Setup-and-Operations-Guide.pdf`.

## Architecture at a glance

| Layer | Choice | Why (short version — full reasoning in SETUP_GUIDE.md) |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | Fast, matches the Notion/Linear/Airtable look the brief asked for |
| Backend | Node.js + TypeScript + Express | One language across the stack, small and easy to maintain |
| Database | SQLite (better-sqlite3 + Drizzle ORM) | Right-sized for 10–20 users; one file, trivial backups, no DB server to run |
| Auth | Email + password, JWT in an httpOnly cookie | Internal tool, no self-signup needed |
| Deployment | Docker Compose on one VPS, Caddy for automatic HTTPS | One process, one bill, simplest possible ops for a small team |

Two roles: **Admin** (Settings access — team management, activity log) and
**Employee** (everything else). Both can add/edit/delete tasks, matching how
the shared Excel file worked today.

## Project layout

```
backend/     Node/TypeScript API + SQLite database
frontend/    React/TypeScript UI
scripts/     Host-level backup script
docs/        Full documentation (also see the two PDFs)
Dockerfile   Multi-stage build: frontend + backend → one image
docker-compose.yml, Caddyfile   Production deployment
```

## Quick start (development)

Full details, including installing prerequisites, are in
`docs/SETUP_GUIDE.md`. The short version, once Node.js 22+ is installed:

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed        # creates the first admin login
npm run dev             # http://localhost:4000

# Frontend (second terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173 — sign in with the seeded admin
```

## Quick start (production)

```bash
cp .env.example .env    # fill in JWT_SECRET, DOMAIN, CORS_ORIGIN, SEED_ADMIN_*
docker compose up -d --build
```

The app is served at your configured `DOMAIN` over HTTPS automatically.

## Tests

```bash
cd backend && npm test    # 23 tests: auth, task CRUD, permissions, work-status logic
cd frontend && npm test   # app-shell smoke test
```
