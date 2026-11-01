#!/usr/bin/env bash
# Encrypted database backups (Task 1.6a, ADR-026). Runs in its own container on the source stack's network, with
# no Docker socket and no private key: it can write backups but cannot read them back.
#
# Every BACKUP_POLL_SECONDS, each database in BACKUP_DATABASES whose newest backup is older than
# BACKUP_INTERVAL_HOURS gets a new one, streamed through pg_dump | age | rclone so no plain dump touches a disk.
# Looking at the destination instead of waiting for a fixed hour lets a machine that was off at night catch up as
# soon as it starts. A backup gets its final name only once complete, and retention runs only after a whole round
# succeeded, so backups that keep failing never eat the last good ones.
#
#   backup.sh        the loop above (the container's default)
#   backup.sh once   one new backup of every database now, then exit (non-zero on failure)
#
# Runbook: docs/runbooks/backup-restore.md. Test: infra/server/test/smoke-backup.sh
set -euo pipefail

SCRIPT_DIR=$(dirname "$0")
# shellcheck source=SCRIPTDIR/common.sh
. "$SCRIPT_DIR/common.sh"

BACKUP_DATABASES=${BACKUP_DATABASES:-app}
BACKUP_INTERVAL_HOURS=${BACKUP_INTERVAL_HOURS:-24}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-35}
BACKUP_POLL_SECONDS=${BACKUP_POLL_SECONDS:-300}
# Touched after every good round; the container's healthcheck reads it (compose.backup.yaml).
HEARTBEAT=/tmp/heartbeat

[[ ${BACKUP_STACK:-} =~ ^(recette|production)$ ]] || die "BACKUP_STACK must be recette or production"
[[ ${BACKUP_AGE_RECIPIENT:-} == age1* ]] || die "BACKUP_AGE_RECIPIENT must be an age public key (age1...)"
for number in "$BACKUP_INTERVAL_HOURS" "$BACKUP_RETENTION_DAYS" "$BACKUP_POLL_SECONDS"; do
  # 0 is refused too: a retention of 0 days would delete every backup.
  [[ $number =~ ^[1-9][0-9]*$ ]] || die "interval, retention and poll must be positive whole numbers, got '$number'"
done
for database in $BACKUP_DATABASES; do
  # Names go into file names, split on `-` by restore.sh.
  [[ $database =~ ^[a-z][a-z0-9_]*$ ]] || die "invalid database name '$database'"
done

# Server time: reading each object's own modification time would cost one extra request per file on R2.
list_recent_backups() {
  rclone lsf "$BACKUP_DESTINATION" --files-only --use-server-modtime \
    --include "/$BACKUP_STACK-$1-*.dump.age" --max-age "${BACKUP_INTERVAL_HOURS}h"
}

take_backup() {
  local name partial
  name="$BACKUP_STACK-$1-$(date -u +%Y%m%dT%H%M%SZ).dump.age"
  partial="$BACKUP_DESTINATION/$name.uploading"
  log "backing up $1"
  # pipefail: a pg_dump that dies halfway must not look like a short, successful upload.
  if pg_dump --dbname "$1" --format custom |
    age --encrypt --recipient "$BACKUP_AGE_RECIPIENT" |
    rclone rcat "$partial" && rclone moveto "$partial" "$BACKUP_DESTINATION/$name"; then
    log "backed up $1 as $name"
    return 0
  fi
  rclone deletefile "$partial" 2>/dev/null || log "$name.uploading was not removed (retention will remove it)"
  return 1
}

apply_retention() {
  rclone delete "$BACKUP_DESTINATION" --verbose --use-server-modtime \
    --include "/$BACKUP_STACK-*.dump.age*" --min-age "${BACKUP_RETENTION_DAYS}d"
}

# run_round <all|due>: returns non-zero if anything failed.
run_round() {
  local database recent taken=0 failed=0
  for database in $BACKUP_DATABASES; do
    if [[ $1 == due ]]; then
      if ! recent=$(list_recent_backups "$database"); then
        log "FAILED: cannot read the destination"
        failed=1
        continue
      fi
      [[ -z $recent ]] || continue
    fi
    if take_backup "$database"; then
      taken=1
    else
      log "FAILED: no new backup of $database"
      failed=1
    fi
  done
  [[ $failed -eq 0 ]] || return 1
  [[ $taken -eq 0 ]] || apply_retention
}

case ${1:-loop} in
  once)
    run_round all
    ;;
  loop)
    trap 'log "stopping"; exit 0' TERM INT
    log "started: $BACKUP_STACK, databases '$BACKUP_DATABASES', every ${BACKUP_INTERVAL_HOURS}h, keeping ${BACKUP_RETENTION_DAYS} days"
    while :; do
      if run_round due; then
        touch "$HEARTBEAT"
      fi
      # In the background so a stop signal interrupts the wait at once.
      sleep "$BACKUP_POLL_SECONDS" &
      wait $! || true
    done
    ;;
  *)
    die "usage: backup.sh [once]"
    ;;
esac
