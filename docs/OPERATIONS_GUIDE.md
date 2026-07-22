# Operations Guide

Covers: common errors and fixes, troubleshooting, the folder structure,
building for production, and maintaining the project over time. For initial
installation and setup, see `SETUP_GUIDE.md`.

---

## 6. Common errors and their solutions

| Error | Cause | Solution |
|---|---|---|
| `Error: Missing required environment variable: JWT_SECRET` | No `.env` file, or it wasn't filled in | `cp .env.example .env` in `backend/`, then set a real value for `JWT_SECRET` |
| `EADDRINUSE: address already in use :::4000` | Another process (often a previous `npm run dev`) is already using the port | Stop the other process, or change `PORT` in `backend/.env` |
| Frontend loads but every request fails / blank data | Backend isn't running, or `CORS_ORIGIN` doesn't match the frontend's URL | Start the backend (`npm run dev` in `backend/`); make sure `CORS_ORIGIN` in `backend/.env` matches the URL you're opening in the browser |
| `403 Forbidden` / "Request rejected for security reasons" on every save | A browser extension or proxy is stripping custom headers, or you're calling the API directly (e.g. with curl) without the `X-Requested-With` header | This header is a CSRF safeguard the frontend sends automatically — if testing the API by hand, add `-H "X-Requested-With: manual-test"` to your request |
| Stuck on a spinner after signing in / signed out immediately | Cookie wasn't accepted — usually because the site is loaded over `http://` in production, where the `Secure` cookie flag blocks it | Access the site over `https://` in production (this is what Caddy provides automatically); `http://localhost` is fine in local development |
| `npm install` fails while installing `better-sqlite3` | Missing build tools on a Linux machine without prebuilt binaries for its architecture | Install build tools: `sudo apt-get install -y python3 make g++`, then re-run `npm install`. Inside Docker this is handled automatically (see `Dockerfile`). |
| Caddy never gets an HTTPS certificate | `DOMAIN` in `.env` doesn't point at the server yet, or ports 80/443 are blocked | Confirm the domain's DNS A record points at the server's IP (`dig <domain>`), and that your firewall/cloud provider allows inbound traffic on ports 80 and 443 |
| `SqliteError: database is locked` | Extremely rare at this scale, but can happen if a backup and a write collide at the exact same instant | The app already uses WAL mode, which makes this very unlikely; if it does happen, the request simply fails and can be retried — no data is corrupted |
| Admin password forgotten | — | Run `npm run db:seed` again after temporarily changing `SEED_ADMIN_EMAIL` to a new address in `.env` to create a fresh admin, then use Settings to fix the original account; or update the password hash directly (see "Resetting a password by hand" below) |

### Resetting a password by hand

If every admin account is locked out, run this from `backend/` (adjust the
email):

```bash
node -e "
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('temporary-new-password', 12));
"
```

Then open the database and update that user's `password_hash` column to the
printed value, for example using the `sqlite3` CLI or a SQLite GUI tool
pointed at `backend/data/app.db` (or `/app/data/app.db` inside the running
container).

---

## 7. Troubleshooting guide

Work through these in order — most problems are caught by the first two or
three steps.

1. **Check both processes are actually running.** In development you need
   the backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in
   `frontend/`) running at the same time, in two separate terminals.

2. **Check the terminal output for the backend.** Every request is logged.
   An error there tells you exactly what failed and why — this is almost
   always more informative than the error shown in the browser.

3. **Check the browser console and Network tab.** Open DevTools (F12). The
   Console shows JavaScript errors; the Network tab shows the actual HTTP
   status code and response body for failed API calls.

4. **Confirm your `.env` file is filled in.** A copied-but-unedited
   `.env.example` will cause confusing failures (e.g. an admin account with
   a placeholder password you don't know).

5. **In Docker, check container logs.**
   ```bash
   docker compose logs -f app
   docker compose logs -f caddy
   ```
   The `app` log shows migration and API errors; the `caddy` log shows
   certificate and proxy issues.

6. **Confirm the database file exists and has the right permissions.**
   In development: `ls -la backend/data/app.db`. In Docker, the file lives
   inside the `app_data` volume — `docker compose exec app ls -la /app/data`.

7. **When in doubt, restart clean.**
   ```bash
   # Development
   # (stop both npm run dev processes, then)
   cd backend && npm run dev
   cd frontend && npm run dev

   # Docker
   docker compose down
   docker compose up -d --build
   ```
   This resolves the large majority of "it just stopped working" situations
   without losing any data (the database lives in a persistent volume/file,
   not in the containers themselves).

8. **Still stuck?** Re-read the exact error message from step 2 or 5 against
   the Common Errors table above — the fix is usually there.

---

## 8. Folder structure explanation

```
project/
├── backend/                     Node.js/TypeScript API
│   ├── src/
│   │   ├── app.ts               Express app: middleware, routes, static file serving
│   │   ├── server.ts            Starts the HTTP server
│   │   ├── config.ts            Reads and validates environment variables
│   │   ├── logger.ts            Structured logging (pino)
│   │   ├── db/
│   │   │   ├── schema.ts        The entire database structure (source of truth)
│   │   │   ├── client.ts        Opens the SQLite file, wraps it with Drizzle
│   │   │   ├── migrate.ts       Applies migrations
│   │   │   ├── seed.ts          Creates the first admin account
│   │   │   └── backup.ts        Point-in-time database backup
│   │   ├── middleware/
│   │   │   ├── auth.ts          Checks the session cookie, enforces admin-only routes
│   │   │   └── errorHandler.ts  Turns any error into a consistent JSON response
│   │   ├── validators/
│   │   │   └── schemas.ts       Every rule for what counts as valid input (Zod)
│   │   ├── lib/
│   │   │   ├── workStatus.ts    Computes a task's pipeline stage from its checkboxes
│   │   │   ├── audit.ts         Writes change-history rows
│   │   │   ├── jwt.ts           Signs/verifies login sessions
│   │   │   └── errors.ts        The ApiError type used throughout the API
│   │   └── routes/               One file per resource: auth, tasks, users, audit
│   ├── scripts/
│   │   └── migrate-excel.ts     One-time legacy Excel import tool
│   ├── tests/                    Backend test suite (vitest)
│   ├── drizzle/                  Generated SQL migration files — commit these to Git
│   └── data/                     The SQLite database file lives here (gitignored)
│
├── frontend/                     React/TypeScript UI
│   └── src/
│       ├── main.tsx              Entry point: providers (React Query, Router, Auth)
│       ├── App.tsx               Route definitions
│       ├── pages/                One file per page (Login, Home, CategoryPage, Settings)
│       ├── components/
│       │   ├── layout/           Sidebar, page layout
│       │   ├── dashboard/        The filterable status cards
│       │   ├── table/            The data table, drive-link cell, toolbar, inline editing
│       │   ├── modals/           Add/Edit popup, confirm dialog
│       │   └── common/           Buttons, the modal shell, status pill
│       ├── hooks/                Data-fetching hooks (React Query) for tasks and users
│       ├── context/               Auth state, shared across the whole app
│       ├── lib/                  API client, work-status helpers, small utilities
│       └── types.ts               Shared TypeScript types matching the API
│
├── scripts/
│   └── backup.sh                  Host-level nightly backup wrapper (see cron setup)
│
├── docs/                          This documentation
├── Dockerfile                     Multi-stage build → one production image
├── docker-compose.yml             The two-container production deployment
├── Caddyfile                      Reverse proxy + automatic HTTPS configuration
└── .env.example                   Template for Docker Compose's environment variables
```

**Why frontend and backend are separate folders, not one project:** they're
independent Node packages with their own `package.json` and dependencies.
This keeps the frontend's browser-only code and the backend's server-only
code from ever accidentally depending on each other, and lets each be built,
tested, and deployed on its own.

---

## 9. Building the production version

You will not normally need to do this by hand — `docker compose up -d
--build` does it automatically inside the `Dockerfile`. To build and run each
piece manually (useful for debugging a build issue):

```bash
# Frontend: produces frontend/dist (static HTML/CSS/JS)
cd frontend
npm run build

# Backend: produces backend/dist (compiled JavaScript)
cd ../backend
npm run build

# Wire them together the same way the Dockerfile does, then run:
mkdir -p public
cp -r ../frontend/dist/* public/
NODE_ENV=production node dist/server.js
```

The backend serves the built frontend directly (see the `existsSync(publicDir)`
check in `src/app.ts`) — in production there is only one server and one port,
no separate frontend server and no CORS to configure.

---

## 10. Updating and maintaining the project

### Changing the database schema

1. Edit `backend/src/db/schema.ts`.
2. Run `npm run db:generate` from `backend/` — this writes a new SQL file
   into `backend/drizzle/`.
3. Commit both the schema change and the new migration file to Git.
4. Deploy as usual (`docker compose up -d --build`) — the new migration is
   applied automatically on container startup.

**Never edit an already-committed migration file.** If you need to change
something you already migrated, write a new migration instead — this keeps
every environment's history consistent.

### Adding a new API endpoint

Add a route in `backend/src/routes/`, validate its input in
`backend/src/validators/schemas.ts`, and call it from a new hook in
`frontend/src/hooks/`. Follow the existing files as a template — every
resource in this project follows the same shape (route → Zod validation →
Drizzle query → response).

### Keeping dependencies up to date

```bash
cd backend && npm outdated   # then npm update, or bump versions individually
cd frontend && npm outdated
```
Run the test suites after updating (`npm test` in both folders) before
deploying.

### Rotating the JWT secret

Changing `JWT_SECRET` immediately signs every existing user out (their
session tokens no longer verify). This is safe to do at any time — update
the `.env` value and redeploy.

### Restoring from a backup

```bash
docker compose down
cp ./backups/app-<timestamp>.db ./backups/restore.db   # pick the one you want
docker compose run --rm -v "$(pwd)/backups/restore.db:/app/data/app.db" app node dist/server.js
```
Or more simply, for a full restore: stop the stack, replace the file inside
the `app_data` volume with the chosen backup, and start the stack again.
Always test a restore occasionally — a backup you've never restored from is
not a verified backup.

### Getting help

Every error the backend produces is logged with full detail — start there.
The codebase is intentionally small and consistently structured (see the
Folder Structure section above) specifically so that a future developer,
even one unfamiliar with the project, can find the relevant file quickly.
