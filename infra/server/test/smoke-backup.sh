#!/usr/bin/env bash
# Smoke test of backups and restores (Task 1.6a, ADR-026), with the real compose files laid out like a real server
# folder. The two stacks' real database services stand in for recette (the restore target) and production (which a
# restore must refuse); rclone's own S3 server stands in for R2, so the S3 path runs without a Cloudflare account.
# Keys, passwords and rows are generated here and are synthetic.
# Uses test project, network and volume names: safe next to the real stacks. Removes everything at the end.
# Runs locally (Git Bash, Linux, macOS) and in CI:
#   bash infra/server/test/smoke-backup.sh
set -euo pipefail

# Relative host paths, and no Git Bash path rewriting of container paths such as /backups (no effect elsewhere).
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."

WORK_DIR="test/.work-backup"
SERVER_DIR="$WORK_DIR/srv"
IMAGE="upwilling-backup:smoke"
BACKUP_PROJECT="smoke-upwilling-backup"
RECETTE_PROJECT="smoke-backup-recette"
PRODUCTION_PROJECT="smoke-backup-prod"
RECETTE_NETWORK="${RECETTE_PROJECT}_default"
PRODUCTION_NETWORK="${PRODUCTION_PROJECT}_default"
EDGE_NETWORK="upwilling-smoke-backup-edge"
S3_CONTAINER="smoke-backup-s3"
# Enough rows for a backup well past age's 64 KiB chunks: the truncation test below cuts after the first one.
ROWS=20000
failures=0

stack() {
  local name=$1 project=$RECETTE_PROJECT file=compose.recette.yaml
  shift
  if [[ $name == production ]]; then
    project=$PRODUCTION_PROJECT
    file=compose.production.yaml
  fi
  EDGE_NETWORK_RECETTE=$EDGE_NETWORK EDGE_NETWORK_PROD=$EDGE_NETWORK \
    docker compose -p "$project" -f "$file" --env-file "$SERVER_DIR/$name/.env" "$@"
}
backup_compose() {
  docker compose -p "$BACKUP_PROJECT" --project-directory "$SERVER_DIR/backup" \
    -f "$SERVER_DIR/backup/compose.backup.yaml" "$@"
}

cleanup() {
  echo "== Removing the test containers, volumes, networks, image and files"
  docker rm -f "$S3_CONTAINER" >/dev/null 2>&1 || true
  backup_compose --profile restore down --volumes --timeout 5 >/dev/null 2>&1 || true
  stack recette down --volumes --timeout 10 >/dev/null 2>&1 || true
  stack production down --volumes --timeout 10 >/dev/null 2>&1 || true
  docker network rm "$EDGE_NETWORK" >/dev/null 2>&1 || true
  docker image rm "$IMAGE" >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }
expect() {
  if [[ $2 == "$3" ]]; then pass "$1"; else fail "$1: got '$2', expected '$3'"; fi
}
# expect_refused <label> <text the output must contain> <command...>
expect_refused() {
  local output
  if output=$("${@:3}" 2>&1); then
    fail "$1: it succeeded"
  elif [[ $output == *"$2"* ]]; then
    pass "$1"
  else
    fail "$1: unexpected output: $output"
  fi
}

sql() { docker exec "$1-postgres-1" psql -U postgres -d "${3:-app}" -Atc "$2" | tr -d '\r'; }
proof_rows() { sql "$RECETTE_PROJECT" 'SELECT count(*) FROM restore_proof'; }

# Runs in the image so it works on the files the container owns, whichever user runs this test.
in_backups() {
  docker run --rm -v "$BACKUPS_PATH:/backups" -w /backups --entrypoint bash "$IMAGE" -c "$1" | tr -d '\r'
}
count_backups() { in_backups "ls -1 | grep -c '^recette-app-2026.*\.dump\.age$' || true"; }
newest_backup() { in_backups "ls -1 | grep '^recette-app-2026.*\.dump\.age$' | sort | tail -n 1"; }

generate_key() {
  docker run --rm -v "$KEYS_PATH:/keys" --entrypoint age-keygen "$IMAGE" -o "/keys/$1" 2>&1 | tr -d '\r' |
    sed -n 's/^Public key: //p'
}
# restore_with <key file> <restore.sh arguments...>
restore_with() {
  local key=$1
  shift
  backup_compose run --rm -T -v "$KEYS_PATH/$key:/run/secrets/age-identity:ro" restore "$@"
}

echo "== Image and server folder"
digest() { grep -o 'postgres:18[^ ]*@sha256:[0-9a-f]*' "$1" | head -n 1; }
expect "pg_dump comes from the database's own image" "$(digest backup/Dockerfile)" "$(digest compose.base.yaml)"
docker build -q -t "$IMAGE" backup >/dev/null

rm -rf "$WORK_DIR"
mkdir -p "$SERVER_DIR/recette" "$SERVER_DIR/production" "$SERVER_DIR/backup" "$SERVER_DIR/backups" "$WORK_DIR/keys"
# Written by the container's user (uid 999) on Linux, removed by the runner's.
chmod 777 "$SERVER_DIR/backups" "$WORK_DIR/keys"
cp compose.backup.yaml "$SERVER_DIR/backup/"
cp -r backup "$SERVER_DIR/backup/backup"
BACKUPS_PATH=$(cd "$SERVER_DIR/backups" && (pwd -W 2>/dev/null || pwd))
KEYS_PATH=$(cd "$WORK_DIR/keys" && (pwd -W 2>/dev/null || pwd))

RECIPIENT=$(generate_key backup-key.txt)
generate_key wrong-key.txt >/dev/null
[[ $RECIPIENT == age1* ]] || { fail "age-keygen gave no public key"; exit 1; }

# The same password on both: the production refusal below must come from the guard, not from a failed login.
PASSWORD=$(openssl rand -hex 32)
for name in recette production; do
  printf 'APP_IMAGE=upwilling-backup-smoke-not-started\nPOSTGRES_PASSWORD=%s\n' "$PASSWORD" >"$SERVER_DIR/$name/.env"
done
# From the real template, so its empty optional settings are tested too. The last value of a name wins.
cp .env.backup.example "$SERVER_DIR/backup/.env"
cat >>"$SERVER_DIR/backup/.env" <<EOF
BACKUP_IMAGE=$IMAGE
BACKUP_NETWORK=$RECETTE_NETWORK
RESTORE_NETWORK=$RECETTE_NETWORK
BACKUP_AGE_RECIPIENT=$RECIPIENT
BACKUP_POLL_SECONDS=2
EOF

echo "== Databases"
docker network create --internal "$EDGE_NETWORK" >/dev/null
stack recette up -d --wait --wait-timeout 60 postgres
stack production up -d --wait --wait-timeout 60 postgres
expect "recette's server says recette" "$(sql "$RECETTE_PROJECT" 'SHOW cluster_name')" "recette"
expect "production's server says production" "$(sql "$PRODUCTION_PROJECT" 'SHOW cluster_name')" "production"
sql "$RECETTE_PROJECT" "CREATE TABLE restore_proof (id int PRIMARY KEY, note text);
  INSERT INTO restore_proof SELECT n, md5(n::text) FROM generate_series(1, ${ROWS}) n" >/dev/null
sql "$PRODUCTION_PROJECT" "CREATE TABLE must_survive (id int); INSERT INTO must_survive VALUES (1)" >/dev/null

echo "== Backup loop"
backup_compose up -d --wait --wait-timeout 60 backup
expect "first backup taken on start" "$(count_backups)" "1"
GOOD=$(newest_backup)
expect "encrypted with age" "$(in_backups "head -c 21 '$GOOD'")" "age-encryption.org/v1"
expect "runs as uid 999" "$(docker exec "$BACKUP_PROJECT-backup-1" id -u | tr -d '\r')" "999"
expect "root file system is read-only" \
  "$(docker exec "$BACKUP_PROJECT-backup-1" sh -c 'touch /usr/local/lib/x 2>/dev/null && echo writable || echo read-only' | tr -d '\r')" \
  "read-only"
expect "no Docker socket" "$(docker exec "$BACKUP_PROJECT-backup-1" sh -c 'test -e /var/run/docker.sock && echo present || echo absent' | tr -d '\r')" "absent"

backup_compose restart backup >/dev/null 2>&1
sleep 5
expect "no second backup while the last one is fresh" "$(count_backups)" "1"

in_backups "touch -d '25 hours ago' '$GOOD'"
for _ in $(seq 1 30); do [[ $(count_backups) == "2" ]] && break; sleep 1; done
expect "catches up after a missed night" "$(count_backups)" "2"
backup_compose stop backup >/dev/null 2>&1

echo "== Failing backups"
OLD=recette-app-20200101T000000Z.dump.age
OTHER_STACK=production-app-20200101T000000Z.dump.age
in_backups "touch -d '40 days ago' $OLD $OTHER_STACK notes.txt"
before=$(count_backups)
expect_refused "a failed dump is reported" "FAILED" \
  backup_compose run --rm -T -e POSTGRES_PASSWORD=wrong backup once
expect "a failed dump leaves no new backup" "$(count_backups)" "$before"
expect "a failed dump leaves no partial file" "$(in_backups "ls -1 | grep -c uploading || true")" "0"
expect "a failed round deletes nothing" "$(in_backups "ls -1 | grep -c '^$OLD$' || true")" "1"

expect_refused "a retention of 0 days is refused" "positive whole numbers" \
  backup_compose run --rm -T -e BACKUP_RETENTION_DAYS=0 backup once
expect_refused "a missing public key is refused" "BACKUP_AGE_RECIPIENT" \
  backup_compose run --rm -T -e BACKUP_AGE_RECIPIENT= backup once

echo "== Retention"
backup_compose run --rm -T backup once >/dev/null 2>&1
expect "an old backup of this stack is deleted" "$(in_backups "ls -1 | grep -c '^$OLD$' || true")" "0"
expect "another stack's backup is kept" "$(in_backups "ls -1 | grep -c '^$OTHER_STACK$' || true")" "1"
expect "other files are kept" "$(in_backups "ls -1 | grep -c '^notes.txt$' || true")" "1"
in_backups "rm -f $OTHER_STACK notes.txt"
GOOD=$(newest_backup)

echo "== Restore refusals (recette keeps its data)"
expect "the list shows the backup" "$(restore_with backup-key.txt list 2>/dev/null | grep -c "$GOOD" || true)" "1"
expect_refused "a wrong key is refused" "no identity matched" restore_with wrong-key.txt check "$GOOD"
TRUNCATED_FILE=recette-app-20200102T000000Z.dump.age
in_backups "head -c 100000 '$GOOD' > $TRUNCATED_FILE"
expect_refused "a truncated file is refused" "age: error" restore_with backup-key.txt check "$TRUNCATED_FILE"
expect_refused "a name outside the destination is refused" "not a backup name" \
  restore_with backup-key.txt check ../../etc/passwd
expect_refused "SQL in a name is refused" "not a backup name" \
  restore_with backup-key.txt apply 'recette-app;drop-20260101T000000Z.dump.age'
expect_refused "apply without a key is refused" "no private key" \
  backup_compose run --rm -T restore apply "$GOOD"
expect_refused "a truncated file is not applied" "age: error" restore_with backup-key.txt apply "$TRUNCATED_FILE"
expect "recette still has its rows" "$(proof_rows)" "$ROWS"

# A valid age file around a broken dump: its table of contents reads fine, and it only fails while loading.
BROKEN_DUMP=recette-app-20200103T000000Z.dump.age
backup_compose run --rm -T --entrypoint bash backup -c \
  "PGPASSWORD=\$POSTGRES_PASSWORD pg_dump -h postgres -U postgres -d app --format custom | head -c 9000 |
   age --encrypt --recipient '$RECIPIENT' > /backups/$BROKEN_DUMP" >/dev/null 2>&1
sql "$RECETTE_PROJECT" 'DELETE FROM restore_proof WHERE id = 1' >/dev/null
if restore_with backup-key.txt apply "$BROKEN_DUMP" >/dev/null 2>&1; then
  fail "a broken dump was applied"
else
  pass "a broken dump is refused"
fi
expect "a failed restore leaves recette as it was" "$(proof_rows)" "$((ROWS - 1))"
expect "a failed restore leaves no scratch database" \
  "$(sql "$RECETTE_PROJECT" "SELECT count(*) FROM pg_database WHERE datname = 'app_incoming'")" "0"

restore_on_production() { RESTORE_NETWORK=$PRODUCTION_NETWORK restore_with "$@"; }
expect_refused "production is refused" "refused: this server reports cluster_name 'production'" \
  restore_on_production backup-key.txt apply "$GOOD"
expect "production keeps its data" "$(sql "$PRODUCTION_PROJECT" 'SELECT count(*) FROM must_survive')" "1"

echo "== Restore"
if restore_with backup-key.txt check "$GOOD" >/dev/null 2>&1; then
  pass "a good backup passes the check"
else
  fail "a good backup fails the check"
fi
expect "check changes nothing" "$(proof_rows)" "$((ROWS - 1))"
sql "$RECETTE_PROJECT" 'CREATE TABLE added_after_backup (id int)' >/dev/null
if restore_with backup-key.txt apply "$GOOD" >/dev/null 2>&1; then pass "apply succeeds"; else fail "apply failed"; fi
expect "the rows are back" "$(proof_rows)" "$ROWS"
expect "the rows are the same" \
  "$(sql "$RECETTE_PROJECT" "SELECT md5(string_agg(note, '' ORDER BY id)) FROM restore_proof")" \
  "$(sql "$RECETTE_PROJECT" "SELECT md5(string_agg(md5(n::text), '' ORDER BY n)) FROM generate_series(1, $ROWS) n" postgres)"
expect "later tables are gone" \
  "$(sql "$RECETTE_PROJECT" "SELECT count(*) FROM pg_tables WHERE tablename = 'added_after_backup'")" "0"
expect "no scratch database left" \
  "$(sql "$RECETTE_PROJECT" "SELECT count(*) FROM pg_database WHERE datname = 'app_incoming'")" "0"

echo "== S3 destination (rclone's S3 server standing in for R2)"
S3_ACCESS=$(openssl rand -hex 8)
S3_SECRET=$(openssl rand -hex 16)
docker run -d --name "$S3_CONTAINER" --network "$RECETTE_NETWORK" --entrypoint bash "$IMAGE" -c \
  "mkdir -p /tmp/s3/upwilling-backups && exec rclone serve s3 --addr :8080 --auth-key '$S3_ACCESS,$S3_SECRET' /tmp/s3" \
  >/dev/null
S3_ENV=(-e BACKUP_DESTINATION=s3stand:upwilling-backups -e RCLONE_CONFIG_S3STAND_TYPE=s3
  -e RCLONE_CONFIG_S3STAND_PROVIDER=Rclone -e "RCLONE_CONFIG_S3STAND_ENDPOINT=http://$S3_CONTAINER:8080/"
  -e "RCLONE_CONFIG_S3STAND_ACCESS_KEY_ID=$S3_ACCESS" -e "RCLONE_CONFIG_S3STAND_SECRET_ACCESS_KEY=$S3_SECRET")
sleep 2
if backup_compose run --rm -T "${S3_ENV[@]}" backup once 2>&1 | grep -q 'backed up app as'; then
  pass "backup uploaded to S3"
else
  fail "backup not uploaded to S3"
fi
S3_BACKUP=$(backup_compose run --rm -T "${S3_ENV[@]}" restore list 2>/dev/null | tr -d '\r' | awk 'END { print $NF }')
sql "$RECETTE_PROJECT" 'DELETE FROM restore_proof' >/dev/null
if backup_compose run --rm -T "${S3_ENV[@]}" -v "$KEYS_PATH/backup-key.txt:/run/secrets/age-identity:ro" \
  restore apply "$S3_BACKUP" >/dev/null 2>&1; then
  pass "restored from S3"
else
  fail "restore from S3 failed"
fi
expect "the rows are back from S3" "$(proof_rows)" "$ROWS"

echo "== Result"
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed."
  exit 1
fi
echo "All backup checks passed."
