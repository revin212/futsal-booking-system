#!/usr/bin/env bash
set -euo pipefail

# Backup Postgres yang berjalan di docker compose.
# Output: /opt/futsalkita/backups/pgdump-<db>-<timestamp>.sql.gz

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/futsalkita/backups}"

DB_NAME="${POSTGRES_DB:-${DB_NAME:-futsal}}"
DB_USERNAME="${POSTGRES_USER:-${DB_USERNAME:-futsal}}"

mkdir -p "${BACKUP_DIR}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/pgdump-${DB_NAME}-${TS}.sql.gz"

cd "${ROOT_DIR}"

docker compose exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip -9' \
  > "${OUT}"

# Keep last 14 days
find "${BACKUP_DIR}" -type f -name "pgdump-${DB_NAME}-*.sql.gz" -mtime +14 -delete

