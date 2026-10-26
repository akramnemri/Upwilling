#!/usr/bin/env bash
# Smoke test of the test-phase public access (Task 1.5c): starts a recette stack and the `ingress` Caddy of
# compose.funnel.yaml, then plays the Tailscale devices (which need a real tailnet and are tested live, runbook)
# by calling each ingress port from a container on the funnel's internal network. Checks routing per port, the
# host the app receives, basic auth with /api/version left open, headers and the ingress's isolation.
# Uses test project and network names: safe next to the real stacks. Removes everything at the end.
# Runs locally (Git Bash, Linux, macOS) and in CI. Needs the image upwilling-web:local and openssl:
#   docker build -f apps/web/Dockerfile -t upwilling-web:local .
#   bash infra/server/test/smoke-funnel.sh
set -euo pipefail

# Relative host paths, and no Git Bash path rewriting of container paths (no effect on Linux and macOS).
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."

WORK_DIR="test/.work-funnel"
NETWORK="upwilling-smoke-funnel-edge-recette"
CLIENT="upwilling-smoke-funnel-client"
# Same test client as smoke-stacks.sh. Multi-arch digest.
CLIENT_IMAGE="curlimages/curl:8.23.0@sha256:a134550be58ab783810e613ae96fd253c38f7bdd16d9bf9be350700c7a29ac06"
# A public name as Tailscale would forward it: the ingress must not depend on it.
PUBLIC_HOST="upwilling-recette.tail0000.ts.net"
failures=0

recette() { docker compose -p upwilling-smoke-funnel-recette -f compose.recette.yaml --env-file "$WORK_DIR/stack.env" "$@"; }
funnel() { docker compose -p upwilling-smoke-funnel -f compose.funnel.yaml --env-file "$WORK_DIR/funnel.env" "$@"; }

cleanup() {
  echo "== Removing the smoke-test projects, network and files"
  docker rm -f "$CLIENT" >/dev/null 2>&1 || true
  if [[ -f $WORK_DIR/funnel.env && -f $WORK_DIR/stack.env ]]; then
    funnel down --volumes --timeout 15 || true
    recette down --volumes --timeout 15 || true
  fi
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

echo "== Test secrets (throwaway, in $WORK_DIR)"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
auth_user="smoke"
auth_password="$(openssl rand -hex 16)"
caddy_image=$(sed -nE 's/^ *image: (caddy:[^ ]+)$/\1/p' compose.funnel.yaml)
auth_hash=$(docker run --rm "$caddy_image" caddy hash-password --plaintext "$auth_password" | tr -d '\r')
cat >"$WORK_DIR/funnel.env" <<EOF
RECETTE_BASIC_AUTH_USER=$auth_user
RECETTE_BASIC_AUTH_HASH='$auth_hash'
EDGE_NETWORK_RECETTE=$NETWORK
EOF
cat >"$WORK_DIR/stack.env" <<EOF
APP_IMAGE=upwilling-web:local
LOG_LEVEL=info
POSTGRES_PASSWORD=$(openssl rand -hex 32)
EDGE_NETWORK_RECETTE=$NETWORK
EOF
docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create --internal "$NETWORK" >/dev/null

echo "== The whole funnel project is valid (Tailscale devices included)"
if TS_AUTHKEY=dummy funnel config --quiet; then pass "compose.funnel.yaml is valid"; else fail "compose.funnel.yaml is invalid"; fi

echo "== Starting recette and the ingress (waits until Docker reports them healthy)"
if ! recette up -d --wait --wait-timeout 180 || ! funnel up -d --wait --wait-timeout 60 ingress; then
  recette ps -a
  funnel ps -a
  funnel logs --tail 50 ingress
  exit 1
fi

docker run -d --name "$CLIENT" --network upwilling-smoke-funnel_internal --entrypoint sleep "$CLIENT_IMAGE" 600 >/dev/null
# request <port> <path> [curl options...]: as the Tailscale device for that port would.
request() {
  local port=$1 path=$2
  shift 2
  docker exec "$CLIENT" curl -s --max-time 10 -H "Host: $PUBLIC_HOST" -H "X-Forwarded-Proto: https" "$@" \
    "http://ingress:$port$path" || true
}
status() { request "$@" -o /dev/null -w '%{http_code}'; }
headers() { request "$@" -D - -o /dev/null | tr -d '\r'; }
AUTH=(-u "$auth_user:$auth_password")

expect_status() {
  local expected=$1 port=$2 path=$3 label=$4 actual
  shift 4
  actual=$(status "$port" "$path" "$@")
  if [[ $actual == "$expected" ]]; then pass "$label: :$port$path -> $actual"; else fail "$label: :$port$path -> $actual (expected $expected)"; fi
}
expect_body() {
  local port=$1 path=$2 text=$3
  shift 3
  if request "$port" "$path" "$@" | grep -qF "$text"; then pass ":$port$path contains \"$text\""; else fail ":$port$path does not contain \"$text\""; fi
}
# expect_header <port> <path> <case-insensitive regex> <present|absent> [curl options...]
expect_header() {
  local port=$1 path=$2 pattern=$3 mode=$4
  shift 4
  if headers "$port" "$path" "$@" | grep -qiE "$pattern"; then
    if [[ $mode == present ]]; then pass ":$port$path has /$pattern/"; else fail ":$port$path has /$pattern/ (must not)"; fi
  else
    if [[ $mode == absent ]]; then pass ":$port$path has no /$pattern/"; else fail ":$port$path lacks /$pattern/"; fi
  fi
}

echo "== Routing per port (the app only answers its recette hosts: a 200 proves the host was replaced)"
expect_status 200 8081 / "academy" "${AUTH[@]}"
expect_body 8081 / "Notre nouveau site arrive bientôt." "${AUTH[@]}"
expect_status 200 8082 / "Career Boost" "${AUTH[@]}"
expect_body 8082 / "construire la vie que vous voulez demain" "${AUTH[@]}"
expect_status 200 8083 / "admin" "${AUTH[@]}"
expect_body 8083 / "espace d'administration" "${AUTH[@]}"
expect_status 404 8081 /admin "no admin on a site" "${AUTH[@]}"

echo "== Basic auth, with /api/version open for the deploy check"
expect_status 401 8081 / "academy without credentials"
expect_status 401 8082 / "Career Boost without credentials"
expect_status 401 8083 / "admin without credentials"
expect_status 401 8081 / "wrong password" -u "$auth_user:wrong-password"
expect_status 401 8081 /api/ready "readiness is not public"
expect_status 200 8081 /api/version "version is public"
expect_body 8081 /api/version '{"version":"'

echo "== Headers"
for port in 8081 8082 8083; do
  expect_header "$port" / '^x-robots-tag: noindex, nofollow$' present "${AUTH[@]}"
  expect_header "$port" / '^x-content-type-options: nosniff$' present "${AUTH[@]}"
  expect_header "$port" / '^x-frame-options: DENY$' present "${AUTH[@]}"
  expect_header "$port" / '^server:' absent "${AUTH[@]}"
  expect_header "$port" / '^x-powered-by:' absent "${AUTH[@]}"
done
# The 401 page too.
expect_header 8081 / '^x-robots-tag: noindex, nofollow$' present
expect_header 8081 / '^x-content-type-options: nosniff$' present
expect_header 8081 / '^x-frame-options: DENY$' present

echo "== Ingress container"
networks=$(docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' \
  upwilling-smoke-funnel-ingress-1 | sed '/^$/d' | sort | tr '\n' ' ')
if [[ $networks == "upwilling-smoke-funnel-edge-recette upwilling-smoke-funnel_internal " ]]; then
  pass "ingress is only on the internal funnel network and the recette edge network"
else
  fail "ingress networks: $networks"
fi
published=$(docker ps --filter "label=com.docker.compose.project=upwilling-smoke-funnel" --format '{{.Ports}}' | grep -- '->' || true)
if [[ -z $published ]]; then pass "the funnel project publishes no port"; else fail "published: $published"; fi
uid=$(funnel exec -T ingress id -u | tr -d '\r')
if [[ $uid == "65534" ]]; then pass "ingress runs as uid 65534 (nobody)"; else fail "ingress runs as uid $uid"; fi
if funnel exec -T ingress sh -c 'touch /etc/caddy/x' 2>/dev/null; then fail "ingress can write its config"; else pass "ingress file system is read-only"; fi

echo "== Result"
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed. Ingress log:"
  funnel logs --tail 40 ingress
  exit 1
fi
echo "All funnel checks passed."
