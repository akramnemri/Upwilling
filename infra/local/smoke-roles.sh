#!/usr/bin/env bash
# Smoke test of the container roles (Task 1.1). Starts infra/local/compose.roles.yaml, checks that each
# role answers only for its own hosts and paths, that the containers are locked down, and that the
# worker stops cleanly on SIGTERM. Then removes the containers (only this compose project's).
# Runs locally (Git Bash, Linux, macOS) and in CI. Needs the image upwilling-web:local:
#   docker build -f apps/web/Dockerfile -t upwilling-web:local .
#   bash infra/local/smoke-roles.sh           # run, then remove the containers
#   bash infra/local/smoke-roles.sh --keep    # leave the containers running afterwards
# EXPECTED_VERSION=<commit SHA> checks /api/version when the image was built with that APP_VERSION (CI does).
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/compose.roles.yaml"
KEEP=false
[[ "${1:-}" == "--keep" ]] && KEEP=true
failures=0

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

cleanup() {
  if [[ $KEEP == false ]]; then
    echo "== Removing the containers of the upwilling-roles project"
    compose down --timeout 15
  fi
}
trap cleanup EXIT

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

# expect_status <expected status> <port> <Host header> <path>
expect_status() {
  local expected=$1 port=$2 host=$3 path=$4 actual
  actual=$(curl -s -o /dev/null --max-time 10 -w '%{http_code}' -H "Host: $host" "http://127.0.0.1:$port$path" || true)
  if [[ $actual == "$expected" ]]; then pass "$host$path on :$port -> $actual"; else fail "$host$path on :$port -> $actual (expected $expected)"; fi
}

# expect_body <port> <Host header> <path> <text the page must contain>
expect_body() {
  local port=$1 host=$2 path=$3 text=$4
  if curl -s --max-time 10 -H "Host: $host" "http://127.0.0.1:$port$path" | grep -qF "$text"; then
    pass "$host$path on :$port contains \"$text\""
  else
    fail "$host$path on :$port does not contain \"$text\""
  fi
}

echo "== Starting web-upwilling, cms and worker (waits until Docker reports them healthy)"
if ! compose up -d --wait --wait-timeout 120; then
  compose ps -a
  compose logs --tail 50
  exit 1
fi
compose ps

echo "== web-upwilling (APP_ROLE=web, SITE=upwilling) on :3001"
expect_status 200 3001 upwilling.localhost /
expect_body 3001 upwilling.localhost / "Notre nouveau site arrive bientôt."
# Files from apps/web/public are copied into the image separately: check the brand icon is served.
expect_status 200 3001 upwilling.localhost /brands/upwilling/icon.svg
expect_status 200 3001 upwilling.localhost /api/ready
# The commit baked in by the publish workflow; "local" for a hand-made build (Task 1.5).
expect_body 3001 upwilling.localhost /api/version "{\"version\":\"${EXPECTED_VERSION:-local}\"}"
# Client assets are copied into the image separately from the standalone server: check one is served.
asset=$(curl -s --max-time 10 -H "Host: upwilling.localhost" http://127.0.0.1:3001/ | grep -oE '/_next/static/[^"]+\.js' | head -n 1 || true)
if [[ -n $asset ]]; then expect_status 200 3001 upwilling.localhost "$asset"; else fail "no /_next/static script referenced by the home page"; fi
expect_status 200 3001 localhost /api/health
expect_status 404 3001 careerboost.localhost /
expect_status 404 3001 admin.localhost /
expect_status 404 3001 upwilling.localhost /admin
expect_status 404 3001 upwilling.localhost /ADMIN
expect_status 404 3001 upwilling.localhost /api/webhooks/stripe
expect_status 404 3001 www.upwilling.localhost /
expect_status 404 3001 unknown.example /

echo "== cms (APP_ROLE=cms) on :3002"
expect_status 200 3002 admin.localhost /
expect_body 3002 admin.localhost / "espace d'administration"
expect_status 200 3002 localhost /api/health
expect_status 404 3002 upwilling.localhost /
expect_status 404 3002 careerboost.localhost /
expect_status 404 3002 unknown.example /

echo "== Container hardening"
for service in web-upwilling cms worker; do
  uid=$(compose exec -T "$service" id -u)
  if [[ $uid == "1000" ]]; then pass "$service runs as uid 1000 (node), not root"; else fail "$service runs as uid $uid"; fi
  if compose exec -T "$service" sh -c 'touch /app/write-test' 2>/dev/null; then
    fail "$service can write to /app (expected a read-only file system)"
  else
    pass "$service cannot write to /app"
  fi
done

echo "== worker"
if compose logs worker | grep -qF '"msg":"worker started"'; then pass "worker logged its start"; else fail "worker start not logged"; fi
echo "   stopping the worker (SIGTERM)"
compose stop --timeout 15 worker
worker_id=$(compose ps -aq worker)
exit_code=$(docker inspect -f '{{.State.ExitCode}}' "$worker_id")
if [[ $exit_code == "0" ]]; then pass "worker exited with code 0 on SIGTERM"; else fail "worker exited with code $exit_code"; fi
if compose logs worker | grep -qF '"msg":"worker stopped"'; then pass "worker logged a clean stop"; else fail "worker stop not logged"; fi

echo "== web shutdown"
echo "   stopping web-upwilling (SIGTERM)"
compose stop --timeout 15 web-upwilling
web_id=$(compose ps -aq web-upwilling)
exit_code=$(docker inspect -f '{{.State.ExitCode}}' "$web_id")
# Next.js drains in-flight requests on SIGTERM, then exits with 143 on purpose (128 + SIGTERM).
# 137 would mean Docker had to SIGKILL it after the timeout.
if [[ $exit_code == "143" ]]; then pass "web-upwilling stopped gracefully (exit 143)"; else fail "web-upwilling exited with code $exit_code"; fi

echo "== Result"
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed. Logs:"
  compose logs --tail 30
  exit 1
fi
echo "All role checks passed."
