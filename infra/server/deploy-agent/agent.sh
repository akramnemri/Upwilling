#!/bin/sh
# Deploy agent (Task 1.5b, ADR-024). Runs in a container next to the stacks, with the Docker socket.
# GitHub never connects to this machine: the agent only pulls. Every DEPLOY_INTERVAL seconds, for each stack in
# DEPLOY_STACKS, it reads the image tag of the same name (`recette`, `production`), which only the promote
# workflow moves, and when that tag points to a new commit:
#   1. fetches the stack's compose files at that commit, so infrastructure changes ship with the code;
#   2. starts the stack on the image's exact digest and waits until every container is healthy;
#   3. checks /api/ready and /api/version (must be that commit) inside the stack;
#   4. on any failure, starts the last good release again and remembers the failed commit, so it does not
#      retry it every minute. Moving the tag to another commit (a fix, or rollback.yml) is the way out.
# Runbook: docs/runbooks/local-server.md. Test: infra/server/test/smoke-deploy.sh
set -eu

IMAGE_REPO=${IMAGE_REPO:-ghcr.io/akramnemri/upwilling-web}
DEPLOY_STACKS=${DEPLOY_STACKS:-recette}
DEPLOY_INTERVAL=${DEPLOY_INTERVAL:-60}
WAIT_TIMEOUT=${WAIT_TIMEOUT:-300}
COMPOSE_SOURCE_URL=${COMPOSE_SOURCE_URL:-https://raw.githubusercontent.com/akramnemri/Upwilling}
# Tests only: copy the compose files from this folder instead of downloading them, and prefix project names.
COMPOSE_SOURCE_DIR=${COMPOSE_SOURCE_DIR:-}
PROJECT_PREFIX=${PROJECT_PREFIX:-}
SERVER_DIR=${SERVER_DIR:-/srv}
STATE_DIR=${STATE_DIR:-/state}
HEARTBEAT=/tmp/heartbeat

log() { printf '%s [%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2"; }

# ---------------------------------------------------------------------------------------------- per stack
stack_file() {
  case $1 in
    recette) echo compose.recette.yaml ;;
    production) echo compose.production.yaml ;;
    *) return 1 ;;
  esac
}
stack_project() {
  case $1 in
    recette) echo "${PROJECT_PREFIX}upwilling-recette" ;;
    production) echo "${PROJECT_PREFIX}upwilling-prod" ;;
  esac
}
# The host the checks send: the stack's academy site (its web-upwilling container only answers that host).
stack_host() {
  case $1 in
    recette) echo recette.upwilling.fr ;;
    production) echo upwilling.fr ;;
  esac
}
stack_network() {
  case $1 in
    recette) echo "${EDGE_NETWORK_RECETTE:-upwilling-edge-recette}" ;;
    production) echo "${EDGE_NETWORK_PROD:-upwilling-edge-prod}" ;;
  esac
}

is_sha() {
  case $1 in
    *[!0-9a-f]* | '') return 1 ;;
  esac
  [ "${#1}" -eq 40 ]
}

# ---------------------------------------------------------------------------------------------- steps
# Prints "<commit> <repository>@<digest>" for the tag named after the stack, after pulling it.
resolve() {
  docker pull -q "$IMAGE_REPO:$1" >/dev/null 2>&1 || return 1
  sha=$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE_REPO:$1")
  is_sha "$sha" || return 1
  digest=$(docker image inspect -f '{{range .RepoDigests}}{{println .}}{{end}}' "$IMAGE_REPO:$1" |
    grep -F "$IMAGE_REPO@sha256:" | head -n 1)
  [ -n "$digest" ] || return 1
  echo "$sha $digest"
}

# fetch_compose <commit> <release dir> <stack compose file>
fetch_compose() {
  for file in compose.base.yaml "$3"; do
    if [ -n "$COMPOSE_SOURCE_DIR" ]; then
      cp "$COMPOSE_SOURCE_DIR/$file" "$2/$file" || return 1
    else
      wget -q -T 30 -O "$2/$file" "$COMPOSE_SOURCE_URL/$1/infra/server/$file" || return 1
    fi
    [ -s "$2/$file" ] || return 1
  done
}

# stack_compose <stack> <release dir> <compose arguments...>
# (POSIX sh has no local variables: helpers use their own names.)
stack_compose() {
  compose_stack=$1
  compose_dir=$2
  shift 2
  docker compose -p "$(stack_project "$compose_stack")" --project-directory "$compose_dir" \
    -f "$compose_dir/$(stack_file "$compose_stack")" \
    --env-file "$SERVER_DIR/$compose_stack/.env" --env-file "$compose_dir/image.env" "$@"
}

# http_get <stack> <release dir> <path>: prints "<status> <body>" as seen from inside web-upwilling.
http_get() {
  # shellcheck disable=SC2016 # JavaScript for node, not shell.
  stack_compose "$1" "$2" exec -T web-upwilling node -e '
    const [path, host] = process.argv.slice(1);
    require("http")
      .get({ host: "127.0.0.1", port: 3000, path, headers: { host } }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => console.log(res.statusCode + " " + body));
      })
      .on("error", (error) => console.log("000 " + error.message));
  ' "$3" "$(stack_host "$1")" 2>&1 | tr -d '\r'
}

# start_release <stack> <release dir> <commit>: up, wait for health, check readiness and version.
start_release() {
  log "$1" "migrations: none yet (placeholder until Task 3.1)"
  if ! stack_compose "$1" "$2" up -d --wait --wait-timeout "$WAIT_TIMEOUT" --remove-orphans; then
    log "$1" "containers did not become healthy"
    return 1
  fi
  ready=$(http_get "$1" "$2" /api/ready)
  case $ready in
    "200 "*) ;;
    *)
      log "$1" "readiness check failed: $ready"
      return 1
      ;;
  esac
  version=$(http_get "$1" "$2" /api/version)
  if [ "$version" != "200 {\"version\":\"$3\"}" ]; then
    log "$1" "version check failed: $version (expected $3)"
    return 1
  fi
}

# Keeps the current and previous releases (files and images) for a fast restore; removes older ones.
prune_releases() {
  keep_current=$(cat "$STATE_DIR/$1/current" 2>/dev/null || true)
  keep_previous=$(cat "$STATE_DIR/$1/previous" 2>/dev/null || true)
  for dir in "$STATE_DIR/$1/releases"/*; do
    [ -d "$dir" ] || continue
    release=$(basename "$dir")
    [ "$release" = "$keep_current" ] || [ "$release" = "$keep_previous" ] && continue
    image=$(sed -n 's/^APP_IMAGE=//p' "$dir/image.env" 2>/dev/null || true)
    [ -n "$image" ] && docker image rm "$image" >/dev/null 2>&1 || true
    rm -rf "$dir"
  done
}

deploy_stack() {
  stack=$1
  if [ ! -f "$SERVER_DIR/$stack/.env" ]; then
    log "$stack" "no $SERVER_DIR/$stack/.env yet: skipped (see the runbook)"
    return 0
  fi
  if ! target=$(resolve "$stack"); then
    log "$stack" "cannot read $IMAGE_REPO:$stack (not promoted yet, or registry unreachable)"
    return 0
  fi
  sha=${target%% *}
  image=${target#* }
  current=$(cat "$STATE_DIR/$stack/current" 2>/dev/null || true)
  failed=$(cat "$STATE_DIR/$stack/failed" 2>/dev/null || true)
  if [ "$sha" = "$current" ] || [ "$sha" = "$failed" ]; then
    return 0
  fi

  log "$stack" "deploying $sha ($image)"
  release="$STATE_DIR/$stack/releases/$sha"
  rm -rf "$release"
  mkdir -p "$release"
  printf 'APP_IMAGE=%s\n' "$image" >"$release/image.env"
  if fetch_compose "$sha" "$release" "$(stack_file "$stack")" && start_release "$stack" "$release" "$sha"; then
    [ -n "$current" ] && echo "$current" >"$STATE_DIR/$stack/previous"
    echo "$sha" >"$STATE_DIR/$stack/current"
    rm -f "$STATE_DIR/$stack/failed"
    log "$stack" "deployed $sha"
    prune_releases "$stack"
    return 0
  fi

  echo "$sha" >"$STATE_DIR/$stack/failed"
  if [ -n "$current" ] && [ -d "$STATE_DIR/$stack/releases/$current" ]; then
    log "$stack" "FAILED to deploy $sha: restoring $current"
    if start_release "$stack" "$STATE_DIR/$stack/releases/$current" "$current"; then
      log "$stack" "restored $current"
    else
      log "$stack" "RESTORE FAILED: the stack needs a human (docs/runbooks/local-server.md)"
    fi
  else
    log "$stack" "FAILED to deploy $sha and there is no previous release: the stack needs a human"
  fi
}

# ---------------------------------------------------------------------------------------------- main
for stack in $DEPLOY_STACKS; do
  if ! stack_file "$stack" >/dev/null; then
    log agent "unknown stack '$stack' in DEPLOY_STACKS (expected: recette, production)"
    exit 1
  fi
  mkdir -p "$STATE_DIR/$stack/releases"
  network=$(stack_network "$stack")
  if ! docker network inspect "$network" >/dev/null 2>&1; then
    docker network create --internal "$network" >/dev/null
    log "$stack" "created the internal edge network $network"
  fi
done

trap 'log agent "stopping"; exit 0' TERM INT
log agent "started: stacks '$DEPLOY_STACKS', image $IMAGE_REPO, every ${DEPLOY_INTERVAL}s"
while :; do
  touch "$HEARTBEAT"
  for stack in $DEPLOY_STACKS; do
    deploy_stack "$stack" || log "$stack" "unexpected error (will try again)"
  done
  touch "$HEARTBEAT"
  # In the background so a stop signal interrupts the wait at once.
  sleep "$DEPLOY_INTERVAL" &
  wait $! || true
done
