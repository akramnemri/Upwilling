#!/usr/bin/env bash
# Restores one backup into recette (Task 1.6a, ADR-026). Runs once per command, on recette's network, with
# recette's password and a private key a human mounts for the occasion (runbook).
#
#   restore.sh list             the backups at the destination, oldest first
#   restore.sh check <backup>   decrypts it and reads it to the end; changes nothing (the dry run)
#   restore.sh apply <backup>   check, then replace the database of the same name on recette
#
# The server has to say it is recette itself (cluster_name, set in compose.recette.yaml): a wrong network or a wrong
# variable here cannot point this at production. `apply` restores into a scratch database first and replaces the
# real one only after that succeeded, so a bad backup leaves recette as it was.
#
# Runbook: docs/runbooks/backup-restore.md. Test: infra/server/test/smoke-backup.sh
set -euo pipefail

SCRIPT_DIR=$(dirname "$0")
# shellcheck source=SCRIPTDIR/common.sh
. "$SCRIPT_DIR/common.sh"

IDENTITY=/run/secrets/age-identity
RESTORE_TARGET=recette
# Set once the scratch database exists, so the exit trap only removes what this run created.
SCRATCH_DATABASE=

decrypt_backup() {
  rclone cat "$BACKUP_DESTINATION/$1" | age --decrypt --identity "$IDENTITY"
}

admin_sql() {
  psql --dbname postgres --no-psqlrc --quiet --set ON_ERROR_STOP=1 --command "$1"
}

drop_scratch_database() {
  if [[ -n $SCRATCH_DATABASE ]]; then
    admin_sql "DROP DATABASE IF EXISTS $SCRATCH_DATABASE WITH (FORCE)"
  fi
}

require_restore_target() {
  local cluster
  cluster=$(psql --dbname postgres --no-psqlrc --tuples-only --no-align --command 'SHOW cluster_name')
  [[ $cluster == "$RESTORE_TARGET" ]] ||
    die "refused: this server reports cluster_name '$cluster', and restores only go into $RESTORE_TARGET"
}

check_backup() {
  local contents tables
  # pg_restore stops after the table of contents; `cat` reads on so age authenticates the file to its last byte.
  contents=$(decrypt_backup "$1" | { pg_restore --list && cat >/dev/null; })
  tables=$(grep -c ' TABLE DATA ' <<<"$contents" || true)
  log "$1 is complete and readable: $tables table(s) with data"
}

apply_backup() {
  require_restore_target
  check_backup "$1"
  log "restoring $1 into a scratch database"
  trap drop_scratch_database EXIT
  SCRATCH_DATABASE="$2_incoming"
  drop_scratch_database
  admin_sql "CREATE DATABASE $SCRATCH_DATABASE"
  # --no-owner: the objects belong to whoever restores. Task 3.1 revisits this with the app's own role.
  decrypt_backup "$1" |
    pg_restore --dbname "$SCRATCH_DATABASE" --no-owner --no-privileges --single-transaction
  log "replacing database $2"
  admin_sql "DROP DATABASE IF EXISTS $2 WITH (FORCE)"
  admin_sql "ALTER DATABASE $SCRATCH_DATABASE RENAME TO $2"
  SCRATCH_DATABASE=
  log "restored $1 into $2 on $RESTORE_TARGET"
}

command=${1:-}
case $command in
  list)
    rclone lsf "$BACKUP_DESTINATION" --files-only --use-server-modtime --include '/*.dump.age' \
      --format tsp --separator ' ' | sort
    ;;
  check | apply)
    backup=${2:-}
    # The name reaches rclone and, for its database part, SQL: only this exact shape gets through.
    [[ $backup =~ ^(recette|production)-([a-z][a-z0-9_]*)-[0-9]{8}T[0-9]{6}Z\.dump\.age$ ]] ||
      die "not a backup name: '$backup' (see: restore.sh list)"
    database=${BASH_REMATCH[2]}
    [[ -f $IDENTITY ]] || die "no private key at $IDENTITY (see the runbook)"
    if [[ $command == check ]]; then
      check_backup "$backup"
    else
      apply_backup "$backup" "$database"
    fi
    ;;
  *)
    die "usage: restore.sh list | check <backup> | apply <backup>"
    ;;
esac
