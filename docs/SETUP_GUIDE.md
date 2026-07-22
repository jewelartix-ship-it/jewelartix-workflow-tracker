# Setup Guide

Covers: what to install, how to install it, first-time project setup, running
the app, and deployment. For errors and ongoing maintenance, see
`OPERATIONS_GUIDE.md`.

---

## 1. Software you need before you start

| Software | Minimum version | Needed for | Download |
|---|---|---|---|
| Node.js | 22.x (LTS) | Running the backend and building the frontend | https://nodejs.org |
| npm | 10.x (bundled with Node.js) | Installing dependencies | bundled with Node.js |
| Git | any recent version | Getting the code onto a machine, deploying updates | https://git-scm.com |
| Docker + Docker Compose | Docker 24+, Compose v2 | Running the app in production | https://www.docker.com |
| A code editor (optional) | — | Editing the code | https://code.visualstudio.com |

You do **not** need to install a database server. SQLite ships as part of the
`better-sqlite3` npm package — there is nothing separate to install or run.

For everyday development you only need Node.js and Git. Docker is only
required when you're ready to deploy.

---

## 2. Installing each piece of software

### Node.js (and npm)

**Windows / macOS:** download the LTS installer from https://nodejs.org and
run it. npm is included automatically.

**macOS (Homebrew):**
```bash
brew install node@22
```

**Ubuntu / Debian Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify:**
```bash
node --version   # should print v22.x.x or later
npm --version    # should print 10.x.x or later
```

### Git

**Windows:** download from https://git-scm.com/download/win and run the installer.

**macOS:** `brew install git`, or install Xcode Command Line Tools (`xcode-select --install`), which includes Git.

**Ubuntu / Debian:** `sudo apt-get install git`

**Verify:** `git --version`

### Docker + Docker Compose

**Windows / macOS:** install Docker Desktop from https://www.docker.com/products/docker-desktop —
this includes Docker Compose automatically.

**Ubuntu / Debian Linux:**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out and back in after this
```

**Verify:**
```bash
docker --version
docker compose version
```

### A code editor (optional, but recommended)

Any editor works. If you don't already have a preference, install
[VS Code](https://code.visualstudio.com) — free, and works well with
TypeScript out of the box.

---

## 3. Complete project setup from a fresh computer

These steps take a brand-new computer to a running local copy of the app.

**Step 1 — Install prerequisites.** Follow section 2 above: Node.js and Git
at minimum. Install Docker too if you'll also test the production build.

**Step 2 — Get the code onto the machine.**
If the project lives in a Git repository:
```bash
git clone <your-repository-url>
cd <project-folder>
```
If you received the project as a folder/zip instead, extract it and `cd`
into it.

**Step 3 — Set up the backend.**
```bash
cd backend
cp .env.example .env
```
Open `.env` in your editor and set at minimum:
- `JWT_SECRET` — any long random string (generate one with `openssl rand -base64 48`)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the first admin login you'll use to sign in

Then install dependencies and prepare the database:
```bash
npm install
npm run db:migrate    # creates the SQLite database and tables
npm run db:seed       # creates the first admin account from your .env values
```

**Step 4 — Set up the frontend.**
```bash
cd ../frontend
npm install
```
No `.env` file is needed for local development — the frontend's dev server
automatically forwards API requests to the backend (see `vite.config.ts`).

**Step 5 — Run both and sign in.** See section 4 below. Once both are
running, open http://localhost:5173 and sign in with the admin email/password
you set in Step 3.

**That's the entire setup.** There is no database server to install, no
message queue, no cache — just two `npm install` commands and two migration
commands.

---

## 4. Running the frontend, backend, and database

### Database

There is nothing to "run" separately — SQLite lives in a single file
(`backend/data/app.db` by default) that the backend opens directly. It's
created automatically by `npm run db:migrate`.

Useful database commands (run from `backend/`):

| Command | What it does |
|---|---|
| `npm run db:migrate` | Creates/updates tables to match the current schema. Safe to re-run. |
| `npm run db:seed` | Creates the first admin account (skips if one already exists). |
| `npm run db:generate` | **Development only** — after changing `src/db/schema.ts`, generates a new migration file. Commit the result to Git. |
| `npm run db:backup` | Writes a point-in-time backup to `backend/data/backups/`. |

### Backend (API server)

```bash
cd backend
npm run dev
```
Starts the API on **http://localhost:4000** with auto-restart on file
changes. Logs print to the terminal.

### Frontend (web UI)

```bash
cd frontend
npm run dev
```
Starts the UI on **http://localhost:5173** with hot-reload. Open this URL in
your browser — it talks to the backend automatically.

**Run both at once:** open two terminals, one for each command above. Leave
both running while you work.

---

## 5. Environment variables, configuration, and deployment

### Backend environment variables (`backend/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | Port the API listens on | `4000` |
| `DATABASE_PATH` | Path to the SQLite file | `./data/app.db` |
| `JWT_SECRET` | Signs login sessions — **must be secret and random** | output of `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | How long a login lasts | `8h` |
| `CORS_ORIGIN` | Where the frontend is served from | `http://localhost:5173` (dev) |
| `SEED_ADMIN_NAME` / `_EMAIL` / `_PASSWORD` | First admin account, used once by `db:seed` | — |

### Root environment variables (`.env`, used by Docker Compose only)

| Variable | Purpose |
|---|---|
| `DOMAIN` | The domain Caddy will get an HTTPS certificate for |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Same as above, passed into the container |
| `CORS_ORIGIN` | Should match `https://<DOMAIN>` |
| `SEED_ADMIN_NAME` / `_EMAIL` / `_PASSWORD` | First admin account for the production database |

**Never commit a real `.env` file to Git** — `.gitignore` already excludes
it. `.env.example` files are safe templates only.

### Deploying to production

The app deploys as a single Docker Compose stack: one container running the
Node app (API + built frontend, both served from one port), and one
container running Caddy as a reverse proxy that gets and renews HTTPS
certificates automatically.

**On your server (a small VPS is enough — 1 vCPU / 1GB RAM comfortably
handles 10–20 users):**

```bash
# 1. Install Docker (see section 2 above) and Git
# 2. Get the code
git clone <your-repository-url>
cd <project-folder>

# 3. Point your domain's DNS A record at the server's IP address first —
#    Caddy needs this to succeed before it can get a certificate.

# 4. Configure
cp .env.example .env
nano .env    # set DOMAIN, JWT_SECRET, CORS_ORIGIN, SEED_ADMIN_*

# 5. Build and start
docker compose up -d --build

# 6. Watch the logs the first time to confirm migrations ran and the
#    certificate was issued
docker compose logs -f
```

Visit `https://<your-domain>` and sign in with your `SEED_ADMIN_*`
credentials. **Change that password immediately** from Settings > My Account.

### Updating a production deployment

```bash
git pull
docker compose up -d --build
```
This rebuilds the image (applying any new migrations automatically on
startup — see `Dockerfile`) and restarts with zero manual database steps.

### Setting up nightly backups

```bash
crontab -e
```
Add:
```
0 2 * * * /full/path/to/project/scripts/backup.sh >> /full/path/to/project/backups/backup.log 2>&1
```
This runs `scripts/backup.sh` every night at 2 AM, which writes a timestamped
copy of the database to `./backups/` on the host (outside the Docker volume)
and automatically deletes backups older than 14 days.
