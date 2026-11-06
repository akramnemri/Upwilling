# shellcheck shell=bash
# Shared by backup.sh and restore.sh. Settings come from the stack's .env and backup/.env (compose.backup.yaml).

LOG_SCOPE=$(basename "$0" .sh)

log() { printf '%s [%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$LOG_SCOPE" "$1"; }

die() {
  log "$1" >&2
  exit 1
}

[[ -n ${POSTGRES_PASSWORD:-} ]] || die "POSTGRES_PASSWORD is missing: it comes from the stack's .env"
[[ -n ${BACKUP_DESTINATION:-} ]] || die "BACKUP_DESTINATION is missing (see .env.backup.example)"

# `postgres` is the database's service name on the stack's network. The superuser, until Task 3.1 adds roles.
export PGHOST=postgres PGUSER=postgres PGPASSWORD=$POSTGRES_PASSWORD PGCONNECT_TIMEOUT=10
