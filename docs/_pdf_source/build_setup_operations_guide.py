import sys
sys.path.insert(0, '.')
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, KeepTogether
from reportlab.lib.units import inch
from pdf_common import (
    styles, PAGE_SIZE, MARGINS, styled_table, code_block, bullets,
    spacer, make_page_decorator, body, h2,
)

OUT = '../Setup-and-Operations-Guide.pdf'
CONTENT_WIDTH = PAGE_SIZE[0] - MARGINS['leftMargin'] - MARGINS['rightMargin']

doc = SimpleDocTemplate(OUT, pagesize=PAGE_SIZE, title='Setup and Operations Guide — Workflow Tracker', **MARGINS)
story = []

# ---------------------------------------------------------------- Title page
story.append(Paragraph('Workflow Tracker', styles['DocSubtitle']))
story.append(Paragraph('Setup and Operations Guide', styles['DocTitle']))
story.append(body(
    'Everything needed to install, run, deploy, and maintain the project — written for whoever is '
    'setting this up, whether or not they built it. The companion <b>Software Requirements</b> PDF '
    'lists what to install before you start here.'
))
story.append(spacer(20))

story.append(h2('Contents'))
sections = [
    '1. Installing each piece of software',
    '2. Complete project setup from a fresh computer',
    '3. Running the frontend, backend, and database',
    '4. Environment variables, configuration, and deployment',
    '5. Common errors and their solutions',
    '6. Troubleshooting guide',
    '7. Folder structure explanation',
    '8. Building the production version',
    '9. Updating and maintaining the project',
]
for s in sections:
    story.append(Paragraph(s, styles['TOCItem']))
story.append(PageBreak())

# ============================================================== 1. Installing software
story.append(Paragraph('1. Installing each piece of software', styles['H1']))

story.append(h2('Node.js (and npm)'))
story.append(body('<b>Windows / macOS:</b> download the LTS installer from nodejs.org and run it. npm is included automatically.'))
story.append(body('<b>macOS (Homebrew):</b>'))
story.append(code_block('brew install node@22', CONTENT_WIDTH))
story.append(body('<b>Ubuntu / Debian Linux:</b>'))
story.append(code_block(
    'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -\n'
    'sudo apt-get install -y nodejs', CONTENT_WIDTH))
story.append(body('<b>Verify:</b>'))
story.append(code_block('node --version   # v22.x.x or later\nnpm --version    # 10.x.x or later', CONTENT_WIDTH))

story.append(h2('Git'))
story.append(body('<b>Windows:</b> download from git-scm.com/download/win and run the installer.'))
story.append(body('<b>macOS:</b> <font face="Courier">brew install git</font>, or install Xcode Command Line Tools (<font face="Courier">xcode-select --install</font>).'))
story.append(body('<b>Ubuntu / Debian:</b> <font face="Courier">sudo apt-get install git</font>'))
story.append(body('<b>Verify:</b> <font face="Courier">git --version</font>'))

story.append(h2('Docker + Docker Compose'))
story.append(body('<b>Windows / macOS:</b> install Docker Desktop from docker.com/products/docker-desktop — this includes Compose automatically.'))
story.append(body('<b>Ubuntu / Debian Linux:</b>'))
story.append(code_block(
    'curl -fsSL https://get.docker.com | sudo sh\n'
    'sudo usermod -aG docker $USER   # log out and back in after this', CONTENT_WIDTH))
story.append(body('<b>Verify:</b>'))
story.append(code_block('docker --version\ndocker compose version', CONTENT_WIDTH))
story.append(PageBreak())

# ============================================================== 2. Fresh setup
story.append(Paragraph('2. Complete project setup from a fresh computer', styles['H1']))
story.append(body('These steps take a brand-new computer to a running local copy of the app.'))

story.append(h2('Step 1 — Install prerequisites'))
story.append(body('Node.js and Git at minimum (see Section 1). Install Docker too if you\u2019ll also test the production build.'))

story.append(h2('Step 2 — Get the code onto the machine'))
story.append(code_block('git clone <your-repository-url>\ncd <project-folder>', CONTENT_WIDTH))

story.append(h2('Step 3 — Set up the backend'))
story.append(code_block('cd backend\ncp .env.example .env', CONTENT_WIDTH))
story.append(body(
    'Open <font face="Courier">.env</font> and set at minimum <font face="Courier">JWT_SECRET</font> '
    '(generate one with <font face="Courier">openssl rand -base64 48</font>) and '
    '<font face="Courier">SEED_ADMIN_EMAIL</font> / <font face="Courier">SEED_ADMIN_PASSWORD</font> '
    '— the first login you\u2019ll use to sign in.'
))
story.append(code_block(
    'npm install\n'
    'npm run db:migrate    # creates the SQLite database and tables\n'
    'npm run db:seed       # creates the first admin account', CONTENT_WIDTH))

story.append(h2('Step 4 — Set up the frontend'))
story.append(code_block('cd ../frontend\nnpm install', CONTENT_WIDTH))
story.append(body('No .env file is needed in local development — the dev server forwards API requests to the backend automatically.'))

story.append(h2('Step 5 — Run both and sign in'))
story.append(body('See Section 3. Once both are running, open http://localhost:5173 and sign in with the admin credentials from Step 3.'))
story.append(body(
    '<b>That\u2019s the entire setup.</b> There is no database server to install, no message queue, no '
    'cache — just two <font face="Courier">npm install</font> commands and two migration commands.'
))
story.append(PageBreak())

# ============================================================== 3. Running
story.append(Paragraph('3. Running the frontend, backend, and database', styles['H1']))

story.append(h2('Database'))
story.append(body(
    'There is nothing to run separately — SQLite lives in one file '
    '(<font face="Courier">backend/data/app.db</font> by default) that the backend opens directly. '
    'It is created automatically by <font face="Courier">npm run db:migrate</font>.'
))
story.append(styled_table(
    ['Command', 'What it does'],
    [
        ['npm run db:migrate', 'Creates/updates tables to match the current schema. Safe to re-run.'],
        ['npm run db:seed', 'Creates the first admin account (skips if one already exists).'],
        ['npm run db:generate', 'Development only \u2014 after changing schema.ts, generates a new migration file to commit.'],
        ['npm run db:backup', 'Writes a point-in-time backup to backend/data/backups/.'],
    ],
    col_widths=[1.7 * inch, 4.65 * inch],
))

story.append(h2('Backend (API server)'))
story.append(code_block('cd backend\nnpm run dev', CONTENT_WIDTH))
story.append(body('Starts the API on <b>http://localhost:4000</b> with auto-restart on file changes.'))

story.append(h2('Frontend (web UI)'))
story.append(code_block('cd frontend\nnpm run dev', CONTENT_WIDTH))
story.append(body('Starts the UI on <b>http://localhost:5173</b> with hot-reload. This is the URL to open in your browser.'))
story.append(body('<b>Run both at once:</b> two terminals, one for each command above, left running while you work.'))
story.append(PageBreak())

# ============================================================== 4. Env / config / deploy
story.append(Paragraph('4. Environment variables, configuration, and deployment', styles['H1']))

story.append(h2('Backend environment variables (backend/.env)'))
story.append(styled_table(
    ['Variable', 'Purpose', 'Example'],
    [
        ['NODE_ENV', 'development or production', 'development'],
        ['PORT', 'Port the API listens on', '4000'],
        ['DATABASE_PATH', 'Path to the SQLite file', './data/app.db'],
        ['JWT_SECRET', 'Signs login sessions \u2014 must be secret/random', 'openssl rand -base64 48'],
        ['JWT_EXPIRES_IN', 'How long a login lasts', '8h'],
        ['CORS_ORIGIN', 'Where the frontend is served from', 'http://localhost:5173'],
        ['SEED_ADMIN_*', 'First admin account, used once by db:seed', '\u2014'],
    ],
    col_widths=[1.3 * inch, 3.05 * inch, 2 * inch],
))

story.append(h2('Root environment variables (.env, Docker Compose only)'))
story.append(styled_table(
    ['Variable', 'Purpose'],
    [
        ['DOMAIN', 'The domain Caddy will get an HTTPS certificate for'],
        ['JWT_SECRET, JWT_EXPIRES_IN', 'Same as above, passed into the container'],
        ['CORS_ORIGIN', 'Should match https://<DOMAIN>'],
        ['SEED_ADMIN_*', 'First admin account for the production database'],
    ],
    col_widths=[2.3 * inch, 4.05 * inch],
))
story.append(body('<b>Never commit a real .env file to Git</b> \u2014 .gitignore already excludes it. The .env.example files are safe templates only.'))

story.append(h2('Deploying to production'))
story.append(body(
    'The app deploys as one Docker Compose stack: one container running the Node app (API + built '
    'frontend, one port), and one container running Caddy as a reverse proxy that gets and renews '
    'HTTPS certificates automatically. A small VPS (1 vCPU / 1GB RAM) comfortably serves 10\u201320 users.'
))
story.append(code_block(
    '# 1. Install Docker and Git on the server\n'
    '# 2. Get the code\n'
    'git clone <your-repository-url>\n'
    'cd <project-folder>\n\n'
    '# 3. Point your domain\u2019s DNS A record at the server\u2019s IP first \u2014\n'
    '#    Caddy needs this to succeed before it can get a certificate.\n\n'
    '# 4. Configure\n'
    'cp .env.example .env\n'
    'nano .env    # set DOMAIN, JWT_SECRET, CORS_ORIGIN, SEED_ADMIN_*\n\n'
    '# 5. Build and start\n'
    'docker compose up -d --build\n\n'
    '# 6. Watch logs the first time\n'
    'docker compose logs -f', CONTENT_WIDTH))
story.append(body(
    'Visit https://&lt;your-domain&gt; and sign in with your SEED_ADMIN_* credentials. '
    '<b>Change that password immediately</b> from Settings \u203a My Account.'
))

story.append(h2('Updating a production deployment'))
story.append(code_block('git pull\ndocker compose up -d --build', CONTENT_WIDTH))
story.append(body('Rebuilds the image and applies any new migrations automatically on startup \u2014 no manual database steps.'))

story.append(h2('Setting up nightly backups'))
story.append(code_block('crontab -e', CONTENT_WIDTH))
story.append(body('Add:'))
story.append(code_block(
    '0 2 * * * /full/path/to/project/scripts/backup.sh '
    '>> /full/path/to/project/backups/backup.log 2>&1', CONTENT_WIDTH))
story.append(body('Runs nightly at 2 AM, writing a timestamped backup to ./backups/ on the host and deleting anything older than 14 days.'))
story.append(PageBreak())

# ============================================================== 5. Common errors
story.append(Paragraph('5. Common errors and their solutions', styles['H1']))
story.append(styled_table(
    ['Error', 'Cause', 'Solution'],
    [
        ['Missing required environment variable: JWT_SECRET', 'No .env file, or not filled in',
         'cp .env.example .env in backend/, then set a real JWT_SECRET'],
        ['EADDRINUSE :::4000', 'Port already in use by another process',
         'Stop the other process, or change PORT in backend/.env'],
        ['Frontend loads but every request fails', 'Backend isn\u2019t running, or CORS_ORIGIN mismatch',
         'Start the backend; make sure CORS_ORIGIN matches the browser URL'],
        ['403 "Request rejected for security reasons"', 'Missing X-Requested-With header (CSRF safeguard)',
         'The frontend sends this automatically; add it manually when testing the API by hand'],
        ['Signed out immediately after signing in', 'Secure cookie blocked over plain http:// in production',
         'Access production over https:// (Caddy provides this); http://localhost is fine in dev'],
        ['npm install fails on better-sqlite3', 'Missing build tools on that Linux machine',
         'sudo apt-get install -y python3 make g++, then retry (handled automatically in Docker)'],
        ['Caddy never gets a certificate', 'DNS doesn\u2019t point at the server, or ports 80/443 blocked',
         'Confirm the domain\u2019s A record and firewall/cloud provider allow inbound 80 and 443'],
        ['Admin password forgotten', '\u2014',
         'See "Resetting a password by hand" below'],
    ],
    col_widths=[1.85 * inch, 2.15 * inch, 2.35 * inch],
))
story.append(spacer(8))
story.append(h2('Resetting a password by hand'))
story.append(body('Run from backend/ (adjust the value):'))
story.append(code_block(
    'node -e "\n'
    "console.log(require('bcryptjs').hashSync('temporary-new-password', 12));\n"
    '"', CONTENT_WIDTH))
story.append(body(
    'Then update that user\u2019s password_hash column to the printed value using a SQLite tool pointed '
    'at backend/data/app.db (or /app/data/app.db inside the running container).'
))
story.append(PageBreak())

# ============================================================== 6. Troubleshooting
story.append(Paragraph('6. Troubleshooting guide', styles['H1']))
story.append(body('Work through these in order \u2014 most problems are caught by the first two or three steps.'))
steps = [
    '<b>Check both processes are running.</b> Development needs the backend and frontend dev servers running at the same time, in two terminals.',
    '<b>Check the backend\u2019s terminal output.</b> Every request is logged; an error there is almost always more informative than what the browser shows.',
    '<b>Check the browser console and Network tab</b> (F12). Console shows JS errors; Network shows the real HTTP status and response body.',
    '<b>Confirm .env is actually filled in</b>, not just copied from the example.',
    '<b>In Docker, check container logs:</b> docker compose logs -f app / caddy.',
    '<b>Confirm the database file exists</b> and has the right permissions.',
    '<b>When in doubt, restart clean</b> \u2014 stop and restart the dev servers, or docker compose down && docker compose up -d --build. This resolves most "it just stopped working" situations without losing data.',
    '<b>Still stuck?</b> Re-read the exact error message against the Common Errors table in Section 5.',
]
for i, s in enumerate(steps, 1):
    story.append(Paragraph(f'{i}. {s}', styles['Bullet']))
story.append(PageBreak())

# ============================================================== 7. Folder structure
story.append(Paragraph('7. Folder structure explanation', styles['H1']))
folder_tree = """project/
+-- backend/                 Node.js/TypeScript API
|   +-- src/
|   |   +-- app.ts           Express app: middleware, routes, static serving
|   |   +-- server.ts        Starts the HTTP server
|   |   +-- config.ts        Reads/validates environment variables
|   |   +-- db/              schema.ts, client.ts, migrate.ts, seed.ts, backup.ts
|   |   +-- middleware/      auth.ts, errorHandler.ts
|   |   +-- validators/      schemas.ts (Zod \u2014 every input rule)
|   |   +-- lib/             workStatus.ts, audit.ts, jwt.ts, errors.ts
|   |   \\-- routes/          auth, tasks, users, audit \u2014 one file per resource
|   +-- scripts/             migrate-excel.ts \u2014 one-time legacy import tool
|   +-- tests/               backend test suite (vitest)
|   +-- drizzle/             generated SQL migrations \u2014 commit these
|   \\-- data/                SQLite database file (gitignored)
|
+-- frontend/                React/TypeScript UI
|   \\-- src/
|       +-- main.tsx         Entry point: providers
|       +-- App.tsx          Route definitions
|       +-- pages/           Login, Home, CategoryPage, Settings
|       +-- components/      layout/, dashboard/, table/, modals/, common/
|       +-- hooks/           React Query hooks for tasks and users
|       +-- context/         Auth state
|       \\-- lib/             API client, work-status helpers, utilities
|
+-- scripts/backup.sh        Host-level nightly backup wrapper
+-- docs/                    This documentation
+-- Dockerfile               Multi-stage build -> one production image
+-- docker-compose.yml       The two-container production deployment
\\-- Caddyfile                Reverse proxy + automatic HTTPS"""
story.append(code_block(folder_tree, CONTENT_WIDTH))
story.append(spacer(8))
story.append(body(
    '<b>Why frontend and backend are separate folders:</b> they are independent Node packages with '
    'their own package.json and dependencies. This keeps browser-only code and server-only code from '
    'ever accidentally depending on each other, and lets each be built, tested, and deployed on its own.'
))
story.append(PageBreak())

# ============================================================== 8. Building for production
story.append(Paragraph('8. Building the production version', styles['H1']))
story.append(body(
    'You will not normally need to do this by hand \u2014 <font face="Courier">docker compose up -d '
    '--build</font> does it automatically. To build and run each piece manually (useful for debugging '
    'a build issue):'
))
story.append(code_block(
    '# Frontend: produces frontend/dist (static HTML/CSS/JS)\n'
    'cd frontend\n'
    'npm run build\n\n'
    '# Backend: produces backend/dist (compiled JavaScript)\n'
    'cd ../backend\n'
    'npm run build\n\n'
    '# Wire them together the same way the Dockerfile does, then run:\n'
    'mkdir -p public\n'
    'cp -r ../frontend/dist/* public/\n'
    'NODE_ENV=production node dist/server.js', CONTENT_WIDTH))
story.append(body(
    'The backend serves the built frontend directly \u2014 in production there is only one server and '
    'one port, no separate frontend server and no CORS to configure.'
))
story.append(PageBreak())

# ============================================================== 9. Maintenance
story.append(Paragraph('9. Updating and maintaining the project', styles['H1']))

story.append(h2('Changing the database schema'))
for b in bullets([
    'Edit backend/src/db/schema.ts.',
    'Run npm run db:generate from backend/ \u2014 writes a new SQL file into backend/drizzle/.',
    'Commit both the schema change and the new migration file to Git.',
    'Deploy as usual \u2014 the new migration is applied automatically on container startup.',
]):
    story.append(b)
story.append(body('<b>Never edit an already-committed migration file.</b> Write a new one instead, to keep every environment\u2019s history consistent.'))

story.append(h2('Adding a new API endpoint'))
story.append(body(
    'Add a route in backend/src/routes/, validate its input in validators/schemas.ts, and call it from '
    'a new hook in frontend/src/hooks/. Every existing resource follows the same shape (route \u2192 Zod '
    'validation \u2192 Drizzle query \u2192 response) \u2014 use one as a template.'
))

story.append(h2('Keeping dependencies up to date'))
story.append(code_block('cd backend && npm outdated   # then npm update, or bump versions individually\ncd frontend && npm outdated', CONTENT_WIDTH))
story.append(body('Run the test suites after updating (npm test in both folders) before deploying.'))

story.append(h2('Rotating the JWT secret'))
story.append(body('Changing JWT_SECRET immediately signs every user out (their tokens no longer verify). Safe to do at any time \u2014 update .env and redeploy.'))

story.append(h2('Restoring from a backup'))
story.append(body(
    'Stop the stack, replace the database file inside the app_data volume with the chosen file from '
    './backups/, and start the stack again. Always test a restore occasionally \u2014 a backup you\u2019ve '
    'never restored from is not a verified backup.'
))

story.append(h2('Getting help'))
story.append(body(
    'Every error the backend produces is logged with full detail \u2014 start there. The codebase is '
    'intentionally small and consistently structured specifically so a future developer, even one '
    'unfamiliar with the project, can find the relevant file quickly.'
))

doc.build(
    story,
    onFirstPage=make_page_decorator('Workflow Tracker \u2014 Setup and Operations Guide'),
    onLaterPages=make_page_decorator('Workflow Tracker \u2014 Setup and Operations Guide'),
)
print(f'Wrote {OUT}')
