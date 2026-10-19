# Runbook — Run the production image locally, one container per role

- Who: the developer or the agent, on a development machine. Never on recette or production.
- When: after changing `apps/web/Dockerfile`, `apps/web/docker/`, the worker, the healthcheck, build config or
  dependencies; to reproduce a container problem locally. CI runs the same smoke test on every PR (`docker` job).
- Files: `apps/web/Dockerfile`, `.dockerignore`, `infra/local/compose.roles.yaml`, `infra/local/smoke-roles.sh`.
- Architecture: `docs/ai/01_ARCHITECTURE.md` §5.1, §5.3, §10; ADR-004. Pinned base image: ADR-018.

## 1. Build the image

From the repository root (Docker Desktop running):

```bash
docker build -f apps/web/Dockerfile -t upwilling-web:local .
```

About 3–4 minutes the first time, faster afterwards (dependency layer and pnpm store cache).
Keep a single local tag (`upwilling-web:local`): every rebuild replaces it.

## 2. Run the three roles

```bash
docker compose -f infra/local/compose.roles.yaml up -d --wait
```

| Service | Role | Open |
|---|---|---|
| `web-upwilling` | `APP_ROLE=web`, `SITE=upwilling` | http://upwilling.localhost:3001 |
| `cms` | `APP_ROLE=cms` | http://admin.localhost:3002 |
| `worker` | `APP_ROLE=worker` | no HTTP; `docker compose -f infra/local/compose.roles.yaml logs -f worker` |

Expected: `http://careerboost.localhost:3001` and `http://upwilling.localhost:3001/admin` answer 404;
`http://upwilling.localhost:3002` answers 404. Ports are bound to `127.0.0.1` only.

The containers run as in production: user `node` (uid 1000), read-only file system (writable: `/tmp` and the
Next.js cache, both tmpfs), memory limits from §5.1, `init: true`, json-file log rotation, Docker healthcheck.

## 3. Automated smoke test

```bash
bash infra/local/smoke-roles.sh
```

Starts the three roles, checks hosts and paths per role, the non-root user and read-only file system,
the worker's clean stop on SIGTERM (exit 0) and the web server's graceful stop (exit 143, see below),
then removes the containers. `--keep` leaves them running. It prints `All role checks passed.` on success.

## 4. Stop and clean up

```bash
docker compose -f infra/local/compose.roles.yaml down
```

To reclaim disk space, remove only this project's image: `docker image rm upwilling-web:local`.
`docker builder prune` removes the build cache of **every** project on the machine: ask before running it.

## Notes

- **Exit codes on `docker stop`:** the worker exits with 0. The Next.js server drains in-flight requests and
  then exits with 143 (128 + SIGTERM) on purpose; 137 would mean Docker had to kill it after the timeout.
- **Healthcheck:** `node /app/apps/web/dist/healthcheck.cjs`. `web`/`cms`: `GET /api/health` on port 3000.
  `worker`: the heartbeat file in `/tmp` must be younger than 60 s. See the result with
  `docker inspect --format '{{json .State.Health}}' <container>`.
- **Invalid environment:** the container prints the problems and exits with code 1 (for example
  `DEPLOY_ENV=production` without `APP_ROLE`). With `restart: unless-stopped` it keeps restarting: read
  `docker compose ... logs <service>`.
- **Windows:** the standalone server (`.next/standalone`) only runs inside the image, not natively on Windows
  (pnpm's symlinks cannot be recreated there). Locally use `pnpm dev`, `pnpm e2e` (`next start`) or this image.
