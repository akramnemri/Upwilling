#!/usr/bin/env bash
# Smoke test of the deploy agent (Task 1.5b): a throwaway local registry stands in for GHCR, and moving the
# `recette` tag stands in for the promote workflow. Checks that the agent deploys a release, then the next one,
# refuses a bad one and restores the last good release (without retrying the bad one), then follows a rollback.
# Uses test project, network and volume names: safe next to the real stacks. Removes everything at the end.
# Runs locally (Git Bash, Linux, macOS) and in CI. Needs the image upwilling-web:local:
#   docker build -f apps/web/Dockerfile -t upwilling-web:local .
#   bash infra/server/test/smoke-deploy.sh
set -euo pipefail

# Relative host paths, and no Git Bash path rewriting of container paths such as /state (no effect elsewhere).
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."

WORK_DIR="test/.work-deploy"
REGISTRY_NAME="upwilling-smoke-registry"
# Test-only registry (Distribution). Multi-arch digest.
REGISTRY_IMAGE="registry:3.1.2@sha256:ddf754342cfc8acc51a56d5d0ab6af06826461864460636d8bd5c546dab2a7b8"
REPO="localhost:5005/upwilling-web"
NETWORK="upwilling-smoke-deploy-edge-recette"
PROJECT="smoke-upwilling-recette"
# Fake commits: valid 40-character SHAs.
V1=$(printf '1%.0s' {1..40})
V2=$(printf '2%.0s' {1..40})
BAD=$(printf '3%.0s' {1..40})
failures=0

agent() {
  SERVER_DIR=./test/.work-deploy/srv docker compose -p upwilling-smoke-deploy-agent \
    -f compose.deploy-agent.yaml -f test/compose.deploy-agent.smoke.yaml "$@"
}

cleanup() {
  echo "== Removing the agent, the test stack, the registry and the test images"
  agent down --volumes --timeout 15 >/dev/null 2>&1 || true
  # The agent created this project; remove it with its own containers, volume and default network.
  mapfile -t ids < <(docker ps -aq --filter "label=com.docker.compose.project=$PROJECT")
  [[ ${#ids[@]} -gt 0 ]] && docker rm -f -v "${ids[@]}" >/dev/null 2>&1
  docker volume rm "${PROJECT}_postgres-data" >/dev/null 2>&1 || true
  docker network rm "${PROJECT}_default" "$NETWORK" >/dev/null 2>&1 || true
  docker rm -f "$REGISTRY_NAME" >/dev/null 2>&1 || true
  mapfile -t images < <(docker image ls "$REPO" --format '{{.Repository}}:{{.Tag}}' | grep -v ':<none>$' || true)
  [[ ${#images[@]} -gt 0 ]] && docker image rm "${images[@]}" >/dev/null 2>&1
  mapfile -t untagged < <(docker image ls "$REPO" -q || true)
  [[ ${#untagged[@]} -gt 0 ]] && docker image rm "${untagged[@]}" >/dev/null 2>&1
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

# release <commit> <version the app reports>: an image derived from upwilling-web:local, pushed to the registry.
release() {
  printf 'FROM upwilling-web:local\nENV APP_VERSION=%s\nLABEL org.opencontainers.image.revision=%s\n' "$2" "$1" |
    docker build -q -t "$REPO:$1" - >/dev/null
  docker push -q "$REPO:$1" >/dev/null
}
# promote <commit>: what the promote workflow does to GHCR.
promote() {
  docker tag "$REPO:$1" "$REPO:recette"
  docker push -q "$REPO:recette" >/dev/null
  echo "   recette tag -> ${1:0:8}…"
}
state() { agent exec -T agent cat "/state/recette/$1" 2>/dev/null | tr -d '\r' || true; }
# wait_for <state file> <expected commit> <seconds>
wait_for() {
  for _ in $(seq 1 "$3"); do
    [[ $(state "$1") == "$2" ]] && return 0
    sleep 1
  done
  return 1
}
running_version() {
  docker exec "$PROJECT-web-upwilling-1" node -e '
    require("http").get({ host: "127.0.0.1", port: 3000, path: "/api/version", headers: { host: "recette.upwilling.fr" } },
      (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => console.log(b)); });
  ' 2>/dev/null | tr -d '\r' || true
}
expect_running() {
  local actual
  actual=$(running_version)
  if [[ $actual == "{\"version\":\"$1\"}" ]]; then pass "recette serves ${1:0:8}…"; else fail "recette serves '$actual' (expected ${1:0:8}…)"; fi
}

echo "== Test registry and three releases"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/srv/recette"
cat >"$WORK_DIR/srv/recette/.env" <<EOF
LOG_LEVEL=info
POSTGRES_PASSWORD=$(openssl rand -hex 32)
EOF
docker run -d --name "$REGISTRY_NAME" -p 127.0.0.1:5005:5000 "$REGISTRY_IMAGE" >/dev/null
for _ in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:5005/v2/ && break; sleep 1; done
release "$V1" "$V1"
release "$V2" "$V2"
# A bad release: its label says one commit, the app reports another. The agent's version check must catch it.
release "$BAD" "$V1"
promote "$V1"

echo "== Agent deploys the first release"
agent up -d --wait --wait-timeout 60
if wait_for current "$V1" 240; then pass "first deploy recorded"; else fail "first deploy not recorded"; fi
expect_running "$V1"

echo "== Agent follows the tag to the next release"
promote "$V2"
if wait_for current "$V2" 240; then pass "second deploy recorded"; else fail "second deploy not recorded"; fi
expect_running "$V2"
if [[ $(state previous) == "$V1" ]]; then pass "previous release remembered"; else fail "previous release is '$(state previous)'"; fi

echo "== A bad release is refused and the last good one restored"
promote "$BAD"
if wait_for failed "$BAD" 240; then pass "bad release marked as failed"; else fail "bad release not marked as failed"; fi
for _ in $(seq 1 120); do agent logs agent 2>/dev/null | grep -q "restored $V2" && break; sleep 1; done
if agent logs agent | grep -qF "restored $V2"; then pass "agent logged the restore"; else fail "no restore logged"; fi
expect_running "$V2"
if [[ $(state current) == "$V2" ]]; then pass "current release unchanged"; else fail "current release is '$(state current)'"; fi
sleep 10
attempts=$(agent logs agent | grep -cF "deploying $BAD" || true)
if [[ $attempts == "1" ]]; then pass "bad release not retried"; else fail "bad release attempted $attempts times"; fi

echo "== Rollback (what rollback.yml does: move the tag back)"
promote "$V1"
if wait_for current "$V1" 240; then pass "rollback deployed"; else fail "rollback not deployed"; fi
expect_running "$V1"
releases=$(agent exec -T agent sh -c 'ls /state/recette/releases | wc -l' | tr -d '\r ')
if [[ $releases -le 2 ]]; then pass "old releases pruned ($releases kept)"; else fail "$releases releases kept (expected at most 2)"; fi

echo "== Agent container"
if [[ $(agent exec -T agent sh -c 'touch /agent/x 2>/dev/null && echo writable || echo read-only' | tr -d '\r') == "read-only" ]]; then
  pass "agent cannot modify its script"
else
  fail "agent script folder is writable"
fi

echo "== Result"
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed. Agent log:"
  agent logs --tail 60 agent
  exit 1
fi
echo "All deploy checks passed."
