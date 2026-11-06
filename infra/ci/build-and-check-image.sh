#!/usr/bin/env bash
# Builds the production image for the runner's own architecture with the commit baked in, then starts it once
# and checks it serves that commit on /api/version (Task 1.5). Used by CI on amd64 and arm64 runners before
# anything is published; also runs locally (Git Bash, Linux, macOS).
#   bash infra/ci/build-and-check-image.sh <image:tag> <40-character commit SHA>
set -euo pipefail

if [[ $# -ne 2 || ! $2 =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: $0 <image:tag> <40-character commit SHA>" >&2
  exit 2
fi
image=$1
version=$2
container=upwilling-version-check

cd "$(dirname "$0")/../.."

echo "== Building $image ($(uname -m)) for commit $version"
docker build --progress=plain -f apps/web/Dockerfile --build-arg "APP_VERSION=$version" -t "$image" .

echo "== Checking that the image serves its commit"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
# DEPLOY_ENV=local without a role: one process serves the local hosts, enough to read /api/version.
docker run -d --name "$container" -p 127.0.0.1:3000:3000 -e DEPLOY_ENV=local "$image" >/dev/null
body=""
for _ in $(seq 1 30); do
  body=$(curl -s --max-time 2 -H "Host: upwilling.localhost" http://127.0.0.1:3000/api/version || true)
  [[ -n $body ]] && break
  sleep 2
done
if [[ $body == "{\"version\":\"$version\"}" ]]; then
  echo "  ok    /api/version -> $body"
else
  echo "  FAIL  /api/version -> '$body' (expected version $version)"
  docker logs --tail 30 "$container"
  exit 1
fi
