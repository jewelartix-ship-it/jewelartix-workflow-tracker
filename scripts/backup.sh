#!/usr/bin/env bash
# Nightly backup wrapper. Runs the backup script inside the running `app`
# container; better-sqlite3's online backup API produces a consistent
# point-in-time copy even while the app is serving traffic.
#
# Install with cron (as the user who owns the docker-compose project):
#   crontab -e
#   0 2 * * * /path/to/project/scripts/backup.sh >> /path/to/project/backups/backup.log 2>&1
#
# Backups land in ./backups on the host (bind-mounted into the container),
# so they survive even if the app_data Docker volume is ever lost. Anything
# older than 14 days is deleted automatically by backup.ts.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "[$(date -Iseconds)] Starting backup…"
docker compose exec -T app node dist/db/backup.js
echo "[$(date -Iseconds)] Backup finished."
