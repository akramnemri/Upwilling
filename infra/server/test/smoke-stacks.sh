#!/usr/bin/env bash
# Smoke test of the server stacks (Task 1.4): starts compose.edge.yaml, compose.production.yaml and
# compose.recette.yaml on this machine, with throwaway test certificates, and checks through Caddy that every
# host goes where 01_ARCHITECTURE.md §5.2 says, with the right protection and headers. Then removes everything.
# Runs locally (Git Bash, Linux, macOS) and in CI, also next to the real stacks: test project and network names.
# Needs the image upwilling-web:local, curl and openssl:
#   docker build -f apps/web/Dockerfile -t upwilling-web:local .
#   bash infra/server/test/smoke-stacks.sh           # run, then remove the containers, volumes and test files
#   bash infra/server/test/smoke-stacks.sh --keep    # leave them running afterwards (remove with the commands printed)
set -euo pipefail

# Relative host paths from here on, and no Git Bash path rewriting: container paths such as /work and openssl
# -subj values must reach the programs unchanged (no effect on Linux and macOS).
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."
# Inside the repository (git-ignored) so Docker Desktop on Windows can mount it as well.
WORK_DIR="test/.work"
CERTS="$WORK_DIR/certs"
PORT="${SMOKE_HTTPS_PORT:-18443}"
CLIENT="upwilling-smoke-client"
# Test-only client with OpenSSL-based curl (client certificates in PEM). Multi-arch digest.
CLIENT_IMAGE="curlimages/curl:8.23.0@sha256:a134550be58ab783810e613ae96fd253c38f7bdd16d9bf9be350700c7a29ac06"
KEEP=false
[[ "${1:-}" == "--keep" ]] && KEEP=true
failures=0

# Test project names, so `down --volumes` can never touch a real stack's database.
edge() { docker compose -p upwilling-smoke-edge -f compose.edge.yaml --env-file "$WORK_DIR/edge.env" "$@"; }
prod() { docker compose -p upwilling-smoke-prod -f compose.production.yaml --env-file "$WORK_DIR/stack.env" "$@"; }
recette() { docker compose -p upwilling-smoke-recette -f compose.recette.yaml --env-file "$WORK_DIR/stack.env" "$@"; }

# Test edge networks, created beforehand as on a server (compose.edge.yaml), never the real ones.
NETWORK_PROD="upwilling-smoke-edge-prod"
NETWORK_RECETTE="upwilling-smoke-edge-recette"

cleanup() {
  if [[ $KEEP == false ]]; then
    echo "== Removing the smoke-test projects (containers, volumes, networks) and test files"
    docker rm -f "$CLIENT" >/dev/null 2>&1 || true
    if [[ -f $WORK_DIR/edge.env && -f $WORK_DIR/stack.env ]]; then
      recette down --volumes --timeout 15 || true
      prod down --volumes --timeout 15 || true
      edge down --volumes --timeout 15 || true
    fi
    docker network rm "$NETWORK_PROD" "$NETWORK_RECETTE" >/dev/null 2>&1 || true
    rm -rf "$WORK_DIR"
  else
    echo "== Kept. Remove later with 'docker rm -f $CLIENT', then 'docker compose -p <project> down -v' for"
    echo "   upwilling-smoke-recette, upwilling-smoke-prod, then upwilling-smoke-edge; then"
    echo "   'docker network rm $NETWORK_PROD $NETWORK_RECETTE' and delete infra/server/$WORK_DIR"
  fi
}
trap cleanup EXIT

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

echo "== Test certificates and secrets (throwaway, in $WORK_DIR)"
rm -rf "$WORK_DIR"
mkdir -p "$CERTS"
# Stand-in for the Cloudflare origin certificate (on the server it is signed by Cloudflare's origin CA).
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -days 2 \
  -subj "/CN=upwilling.fr" -addext "subjectAltName=DNS:upwilling.fr,DNS:*.upwilling.fr" \
  -keyout "$CERTS/origin.key" -out "$CERTS/origin.pem" 2>/dev/null
# Stand-in for the Authenticated Origin Pulls CA and the client certificate Cloudflare presents.
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -days 2 \
  -subj "/CN=Smoke test origin-pull CA" -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign" \
  -keyout "$WORK_DIR/pull-ca.key" -out "$CERTS/origin-pull-ca.pem" 2>/dev/null
openssl req -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -subj "/CN=Smoke test Cloudflare" \
  -keyout "$WORK_DIR/client.key" -out "$WORK_DIR/client.csr" 2>/dev/null
printf 'extendedKeyUsage=clientAuth\n' > "$WORK_DIR/client.ext"
openssl x509 -req -in "$WORK_DIR/client.csr" -CA "$CERTS/origin-pull-ca.pem" -CAkey "$WORK_DIR/pull-ca.key" \
  -CAcreateserial -days 2 -extfile "$WORK_DIR/client.ext" -out "$WORK_DIR/client.pem" 2>/dev/null

auth_user="smoke"
auth_password="$(openssl rand -hex 16)"
caddy_image=$(sed -nE 's/^ *image: (caddy:[^ ]+)$/\1/p' compose.edge.yaml)
auth_hash=$(docker run --rm "$caddy_image" caddy hash-password --plaintext "$auth_password" | tr -d '\r')

cat > "$WORK_DIR/edge.env" <<EOF
CADDY_UID=$(id -u)
CADDY_GID=$(id -g)
CADDY_CERTS_DIR=./test/.work/certs
EDGE_HTTPS_PUBLISH=127.0.0.1:$PORT
RECETTE_BASIC_AUTH_USER=$auth_user
RECETTE_BASIC_AUTH_HASH='$auth_hash'
EDGE_NETWORK_PROD=$NETWORK_PROD
EDGE_NETWORK_RECETTE=$NETWORK_RECETTE
EOF
cat > "$WORK_DIR/stack.env" <<EOF
APP_IMAGE=upwilling-web:local
LOG_LEVEL=info
POSTGRES_PASSWORD=$(openssl rand -hex 32)
EDGE_NETWORK_PROD=$NETWORK_PROD
EDGE_NETWORK_RECETTE=$NETWORK_RECETTE
EOF
for network in "$NETWORK_PROD" "$NETWORK_RECETTE"; do
  docker network inspect "$network" >/dev/null 2>&1 || docker network create --internal "$network" >/dev/null
done

echo "== Starting the edge, production and recette projects (waits until Docker reports them healthy)"
for stack in edge prod recette; do
  if ! "$stack" up -d --wait --wait-timeout 180; then
    "$stack" ps -a
    "$stack" logs --tail 50
    exit 1
  fi
done

echo "== Published port: only TLS with Cloudflare's client certificate gets in"
# From the host, without the client certificate (Git Bash's curl cannot present a PEM one anyway).
no_client_cert=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "recette.upwilling.fr:$PORT:127.0.0.1" \
  -k "https://recette.upwilling.fr:$PORT/" || true)
if [[ $no_client_cert == "000" ]]; then pass "no client certificate -> TLS handshake refused"; else fail "no client certificate -> $no_client_cert (expected a refused handshake)"; fi

# The other requests play Cloudflare: they come from a curl container on the edge project's ingress network,
# with the test client certificate, so they behave the same on Windows, Linux and macOS.
docker run -d --name "$CLIENT" --user root --network upwilling-smoke-edge_default --entrypoint sleep "$CLIENT_IMAGE" 600 >/dev/null
docker cp "$WORK_DIR/." "$CLIENT:/work"

# request <host> <path> [curl options...]: curl through Caddy as Cloudflare would.
request() {
  local host=$1 path=$2
  shift 2
  docker exec "$CLIENT" curl -s --max-time 10 --connect-to "::caddy:8443" --cacert /work/certs/origin.pem \
    --cert /work/client.pem --key /work/client.key "$@" "https://$host$path" || true
}
# https <host> <path> [curl options...]: prints the status code (000 when the TLS handshake fails).
https() { request "$@" -o /dev/null -w '%{http_code}'; }
# headers <host> <path> [curl options...]: prints the response headers.
headers() { request "$@" -D - -o /dev/null | tr -d '\r'; }
body() { request "$@"; }
AUTH=(-u "$auth_user:$auth_password")
# Caddy's own 404 has no request ID; a response from the app does (its proxy sets one on every response).
REQUEST_ID='^x-request-id:'
NOINDEX='^x-robots-tag: noindex, nofollow'

expect_status() {
  local expected=$1 host=$2 path=$3 label=$4 actual
  shift 4
  actual=$(https "$host" "$path" "$@")
  if [[ $actual == "$expected" ]]; then pass "$label: $host$path -> $actual"; else fail "$label: $host$path -> $actual (expected $expected)"; fi
}
expect_body() {
  local host=$1 path=$2 text=$3
  shift 3
  if body "$host" "$path" "$@" | grep -qF "$text"; then pass "$host$path contains \"$text\""; else fail "$host$path does not contain \"$text\""; fi
}
# expect_header <host> <path> <case-insensitive regex> <present|absent> [curl options...]
expect_header() {
  local host=$1 path=$2 pattern=$3 mode=$4
  shift 4
  if headers "$host" "$path" "$@" | grep -qiE "$pattern"; then
    if [[ $mode == present ]]; then pass "$host$path has /$pattern/"; else fail "$host$path has /$pattern/ (must not)"; fi
  else
    if [[ $mode == absent ]]; then pass "$host$path has no /$pattern/"; else fail "$host$path lacks /$pattern/"; fi
  fi
}

echo "== Origin TLS (origin certificate + Authenticated Origin Pulls)"
expect_status 200 recette.upwilling.fr /api/ready "client certificate accepted" "${AUTH[@]}"
expect_status 404 stray.upwilling.fr / "unknown name under the certificate"
expect_status 421 recette.upwilling.fr / "Host header differs from the TLS name" -H "Host: upwilling.fr"

echo "== Recette (basic auth, noindex)"
expect_status 401 recette.upwilling.fr / "no credentials"
expect_status 401 recette.upwilling.fr / "wrong password" -u "$auth_user:wrong-password"
expect_status 200 recette.upwilling.fr / "academy site" "${AUTH[@]}"
expect_body recette.upwilling.fr / "Notre nouveau site arrive bientôt." "${AUTH[@]}"
expect_status 200 recette.upwilling.fr /api/ready "readiness" "${AUTH[@]}"
expect_status 404 recette.upwilling.fr /admin "no admin on a site host" "${AUTH[@]}"
expect_header recette.upwilling.fr / "$NOINDEX" present "${AUTH[@]}"
# The 401 answer too, without credentials.
expect_header recette.upwilling.fr / "$NOINDEX" present
expect_header recette.upwilling.fr / '^x-content-type-options: nosniff$' present
expect_header recette.upwilling.fr / '^x-frame-options: DENY$' present
expect_status 200 recette-careerboost.upwilling.fr / "Career Boost site" "${AUTH[@]}"
expect_body recette-careerboost.upwilling.fr / "construire la vie que vous voulez demain" "${AUTH[@]}"
expect_status 401 recette-admin.upwilling.fr / "admin without credentials"
expect_status 200 recette-admin.upwilling.fr / "admin" "${AUTH[@]}"
expect_body recette-admin.upwilling.fr / "espace d'administration" "${AUTH[@]}"
expect_status 404 recette-hooks.upwilling.fr / "hooks host, no basic auth, root refused"
expect_header recette-hooks.upwilling.fr /admin "$REQUEST_ID" absent
expect_header recette-hooks.upwilling.fr /api/webhooks/smoke "$REQUEST_ID" present
expect_header recette-hooks.upwilling.fr /api/webhooks/smoke "$NOINDEX" present
# Dot segments must not walk out of the webhook prefix, raw or percent-encoded.
expect_status 404 recette-hooks.upwilling.fr /api/webhooks/../admin "dot segments" --path-as-is
expect_status 404 recette-hooks.upwilling.fr /api/webhooks/%2e%2e/admin "encoded dot segments" --path-as-is

echo "== Production (no basic auth)"
expect_status 200 upwilling.fr / "academy site"
expect_body upwilling.fr / "Notre nouveau site arrive bientôt."
expect_status 200 careerboost.upwilling.fr / "Career Boost site"
expect_status 200 admin.upwilling.fr / "admin (Cloudflare Access in front)"
expect_header admin.upwilling.fr / '^x-robots-tag:' present
expect_header upwilling.fr / '^x-robots-tag:' absent
expect_status 301 www.upwilling.fr "/formations?ref=smoke" "www redirect"
expect_header www.upwilling.fr "/formations?ref=smoke" '^location: https://upwilling.fr/formations\?ref=smoke$' present
expect_status 404 hooks.upwilling.fr / "hooks host root"
expect_header hooks.upwilling.fr /admin "$REQUEST_ID" absent
expect_header hooks.upwilling.fr /api/webhooks/smoke "$REQUEST_ID" present

echo "== Security headers"
for host in upwilling.fr careerboost.upwilling.fr admin.upwilling.fr; do
  expect_header "$host" / '^x-content-type-options: nosniff$' present
  expect_header "$host" / '^x-frame-options: DENY$' present
  expect_header "$host" / '^referrer-policy: strict-origin-when-cross-origin$' present
  expect_header "$host" / '^permissions-policy: ' present
  expect_header "$host" / '^server:' absent
  expect_header "$host" / '^x-powered-by:' absent
done
expect_header recette.upwilling.fr / '^x-content-type-options: nosniff$' present "${AUTH[@]}"

echo "== Isolation"
for project in upwilling-smoke-prod upwilling-smoke-recette; do
  published=$(docker ps --filter "label=com.docker.compose.project=$project" --format '{{.Names}} {{.Ports}}' | grep -- '->' || true)
  if [[ -z $published ]]; then pass "$project publishes no port"; else fail "$project publishes a port: $published"; fi
done
if recette exec -T web-upwilling getent hosts prod-web-upwilling >/dev/null 2>&1; then
  fail "recette web can resolve a production container"
else
  pass "recette web cannot reach production containers"
fi
if edge exec -T caddy nc -z -w 3 postgres 5432 >/dev/null 2>&1; then
  fail "Caddy can reach a database"
else
  pass "Caddy cannot reach the databases"
fi
if recette exec -T postgres pg_isready -U postgres -d app >/dev/null; then pass "recette postgres accepts connections on its own network"; else fail "recette postgres not ready"; fi

echo "== Container hardening"
caddy_uid=$(edge exec -T caddy id -u | tr -d '\r')
if [[ $caddy_uid == "$(id -u)" && $caddy_uid != "0" ]]; then pass "caddy runs as uid $caddy_uid, not root"; else fail "caddy runs as uid $caddy_uid"; fi
if edge exec -T caddy sh -c 'touch /etc/write-test' 2>/dev/null; then fail "caddy can write to its file system"; else pass "caddy file system is read-only"; fi
pg_uid=$(prod exec -T postgres id -u | tr -d '\r')
if [[ $pg_uid == "999" ]]; then pass "postgres runs as uid 999"; else fail "postgres runs as uid $pg_uid"; fi
for service in web-upwilling cms worker; do
  uid=$(prod exec -T "$service" id -u | tr -d '\r')
  if [[ $uid == "1000" ]]; then pass "prod $service runs as uid 1000"; else fail "prod $service runs as uid $uid"; fi
done

echo "== Memory in use (docker stats, idle)"
mapfile -t smoke_containers < <(docker ps -q --filter name=upwilling-smoke-)
docker stats --no-stream --format '  {{.Name}}: {{.MemUsage}}' "${smoke_containers[@]}" || true

echo "== Result"
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed. Caddy logs:"
  edge logs --tail 40
  exit 1
fi
echo "All stack checks passed."
