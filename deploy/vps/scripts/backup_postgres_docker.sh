#!/usr/bin/env bash
set -euo pipefail

# Backup Postgres di container Docker (satu instance bersama banyak DB).
# Output: ${BACKUP_DIR}/pgdump-<db>-<timestamp>.sql.gz
#
# Environment:
#   POSTGRES_CONTAINER  nama container (default: shared-postgres)
#   DB_NAME             database yang di-dump (default: futsal)
#   DB_USERNAME         user Postgres untuk pg_dump (default: futsal)
#   DB_PASSWORD         password untuk PGPASSWORD
#   BACKUP_DIR          direktori output (default: /opt/futsalkita/backups)

BACKUP_DIR="${BACKUP_DIR:-/opt/futsalkita/backups}"

CONTAINER="${POSTGRES_CONTAINER:-shared-postgres}"
DB_NAME="${DB_NAME:-${POSTGRES_DB:-futsal}}"
DB_USERNAME="${DB_USERNAME:-${POSTGRES_USER:-futsal}}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "backup_postgres_docker.sh: DB_PASSWORD must be set (or load .env before running)." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/pgdump-${DB_NAME}-${TS}.sql.gz"

docker exec -e PGPASSWORD="${DB_PASSWORD}" "${CONTAINER}" \
  pg_dump -U "${DB_USERNAME}" "${DB_NAME}" | gzip -9 > "${OUT}"

# Keep last 14 days
find "${BACKUP_DIR}" -type f -name "pgdump-${DB_NAME}-*.sql.gz" -mtime +14 -delete
