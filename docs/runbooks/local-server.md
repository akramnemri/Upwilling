# Runbook — The local machine as the server: deploy agent (Task 1.5b) [HUMAN]

- Who: the supervisor, on the Windows machine that serves as the test-phase server (no VPS or domain yet).
- What: a merge to `develop` is deployed to the **recette** stack on this machine within about a minute, with no
  manual step; production follows `main` after your approval. Decision: ADR-024.
- Files: `infra/server/compose.deploy-agent.yaml`, `infra/server/deploy-agent/agent.sh`,
  `.github/workflows/promote.yml`, `rollback.yml`, jobs `deploy-*` of `ci.yml`.
- Public access to recette comes with Task 1.5c (Tailscale Funnel). Until then, recette runs only on this machine.

## How it works

1. A merge to `develop` → CI checks and publishes the image → job `deploy-recette` moves the image tag
   `ghcr.io/akramnemri/upwilling-web:recette` to that commit.
2. The deploy agent (a small container on this machine) checks that tag every minute. When it moves, it fetches the
   commit's compose files, starts the recette stack on the new image, waits until every container is healthy,
   and checks `/api/ready` and `/api/version`.
3. If anything fails, it starts the previous release again and logs `FAILED … restoring …`. It does not retry the
   failed commit; the next merge (a fix) or a rollback moves on.

## 1. GitHub environments (once, in the browser)

Repository **Settings → Environments → New environment**:

| Name | Settings |
|---|---|
| `recette` | Deployment branches and tags: **Selected branches and tags** → add `develop`. No reviewer. |
| `production` | **Required reviewers**: yourself, then **Save protection rules**. Deployment branches and tags: **Selected branches and tags** → add `main`. |

Create `production` **before** anything is merged into `main`: GitHub creates a missing environment on first use,
without protection.

## 2. Docker Desktop (once)

Settings → General → **Start Docker Desktop when you sign in to your computer**: on. The containers restart by
themselves once Docker Desktop runs.

## 3. The server folder (once)

In PowerShell, from the repository folder, on an up-to-date `develop`:

```powershell
New-Item -ItemType Directory -Force C:\upwilling-server\agent\deploy-agent, C:\upwilling-server\recette
Copy-Item infra\server\compose.deploy-agent.yaml C:\upwilling-server\agent\
Copy-Item infra\server\deploy-agent\agent.sh C:\upwilling-server\agent\deploy-agent\
```

Then create `C:\upwilling-server\recette\.env` (Notepad is fine) with:

```text
LOG_LEVEL=info
POSTGRES_PASSWORD=<64 hexadecimal characters>
```

Get the password from Git Bash with `openssl rand -hex 32` and keep it in your password manager. Do not set
`APP_IMAGE`: the agent chooses the image. Never put this file in the repository.

## 4. Start the agent

```powershell
cd C:\upwilling-server\agent
docker compose -f compose.deploy-agent.yaml up -d
docker compose -f compose.deploy-agent.yaml logs -f agent
```

Expected log lines (Ctrl+C stops following, not the agent):

- `started: stacks 'recette' …`, then, once the `recette` tag exists (after the first merge to `develop` that
  contains Task 1.5b): `deploying <commit>` … `deployed <commit>`.
- Before that: `cannot read ghcr.io/akramnemri/upwilling-web:recette (not promoted yet …)` every minute: normal.

## 5. Check what runs

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
docker exec upwilling-recette-web-upwilling-1 node -e "require('http').get({host:'127.0.0.1',port:3000,path:'/api/version',headers:{host:'recette.upwilling.fr'}},r=>r.pipe(process.stdout))"
```

The second command prints `{"version":"<commit>"}`: the commit of the last merge to `develop`.

## 6. Roll back

GitHub → **Actions** → **Rollback** → **Run workflow**: choose the stack and paste the full commit SHA to go back
to (Actions history or `git log --format=%H`). Run it from the `develop` branch for recette, from `main` for
production (the environments only accept those branches). Production waits for your approval. The agent deploys
the commit within a minute. The database is never rolled back automatically.

## 7. Production on this machine (later)

When the first `develop → main` promotion is planned: create `C:\upwilling-server\production\.env` like the recette
one (a different password), add `DEPLOY_STACKS=recette production` to `C:\upwilling-server\agent\.env`, then
`docker compose -f compose.deploy-agent.yaml up -d` again. Production is not exposed publicly from this machine.

## 8. Everyday operations

| Task | Command (PowerShell, in `C:\upwilling-server\agent`) |
|---|---|
| Agent log | `docker compose -f compose.deploy-agent.yaml logs --tail 50 agent` |
| Stack status | `docker compose -p upwilling-recette ps` |
| Stack logs | `docker compose -p upwilling-recette logs --tail 100 web-upwilling` |
| Stop the agent (stacks keep running) | `docker compose -f compose.deploy-agent.yaml stop` |
| Update the agent after `agent.sh` or its compose file changed in the repository | copy the files again (§3), then `docker compose -f compose.deploy-agent.yaml up -d --force-recreate` |
| Stop recette (data kept) | `docker compose -p upwilling-recette stop` |

- **Never** `down -v` / `--volumes` on `upwilling-recette` or `upwilling-prod`: it deletes the database volume.
- `FAILED to deploy … restoring …` in the log: the new commit did not start or did not answer correctly. Read the
  lines just above it, fix through a normal PR (or roll back, §6).
- `RESTORE FAILED` or `no previous release`: the stack needs a human. Send the agent log and
  `docker compose -p upwilling-recette ps -a` to the agent (no `.env` contents).
- The agent has access to Docker on this machine (equivalent to administrator rights inside Docker). It only runs
  images from `ghcr.io/akramnemri/upwilling-web`, by exact digest, and only what the `recette`/`production` tags
  point to (ADR-024).

## 9. Public access to recette: Tailscale Funnel (Task 1.5c, ADR-025)

Result: three public addresses, all behind the recette password except `/api/version`:

| Address | Site |
|---|---|
| `https://upwilling-recette.<tailnet>.ts.net` | Academy |
| `https://careerboost-recette.<tailnet>.ts.net` | Career Boost |
| `https://admin-recette.<tailnet>.ts.net` | Admin |

`<tailnet>` is your tailnet's DNS name, shown on the **DNS** page of the Tailscale admin console (`tailXXXX.ts.net`).
They work only while this machine and Docker Desktop run.

**a. Tailscale admin console, once** (https://login.tailscale.com/admin):

1. **DNS** page: **MagicDNS** on, then **HTTPS Certificates** → Enable.
2. **Access controls** page, in the policy file:
   - add the tag (inside the top-level `{ }`):
     ```json
     "tagOwners": { "tag:upwilling-recette": ["autogroup:admin"] },
     ```
   - give it Funnel; if a `"nodeAttrs"` list already exists, add only the `{ … }` entry to it:
     ```json
     "nodeAttrs": [ { "target": ["tag:upwilling-recette"], "attr": ["funnel"] } ],
     ```
   - in the rule that allows everything (`"src": ["*"]`, in `"grants"` or `"acls"`), replace `"*"` in **src** with
     `"autogroup:member"`. Your own devices keep full access; the tagged recette devices can no longer open
     connections to them.
   - **Save**. The console refuses an invalid file.
3. **Settings → Keys → Generate auth key**: Reusable **on**, Expiration 1 day is enough, Ephemeral **off**,
   Tags **on** → `tag:upwilling-recette`. Copy the key.

**b. On this machine.** In `C:\upwilling-server\funnel\` (the agent can prepare this part when asked):

- copies of `infra/server/compose.funnel.yaml`, `infra/server/caddy/Caddyfile.funnel` (into `caddy\`) and
  `infra/server/tailscale/serve-*.json` (into `tailscale\`);
- `.env` from `infra/server/.env.funnel.example`: `RECETTE_BASIC_AUTH_USER`, `RECETTE_BASIC_AUTH_HASH` (between single
  quotes) and `TS_AUTHKEY=` followed by the key you copied. Paste the key yourself; never in a chat.

Then:

```powershell
cd C:\upwilling-server\funnel
docker compose -f compose.funnel.yaml up -d --wait
```

Within a minute the three devices appear on the console's **Machines** page with the tag `tag:upwilling-recette`.
The first visit to each address can take a few seconds (certificate). Then:

- remove the key from `.env` (keep the line `TS_AUTHKEY=`) and **revoke** it in Settings → Keys: the devices keep
  their identity in Docker volumes and do not need it again;
- in GitHub, repository Settings → Environments → **recette** → Environment variables → **Add variable**:
  `RECETTE_PUBLIC_URL` = `https://upwilling-recette.<tailnet>.ts.net`. From then on the deploy workflow also checks
  that recette answers with the new commit (a warning, not a failure, when this machine is off).

**c. Checks and everyday use**

| Check | Expected |
|---|---|
| Open each address | The browser asks for the recette user and password, then shows the site |
| `https://upwilling-recette.<tailnet>.ts.net/api/version` | `{"version":"<commit>"}` without a password |
| Status | `docker compose -f compose.funnel.yaml ps`: four containers `healthy` |
| Stop public access (recette keeps running) | `docker compose -f compose.funnel.yaml stop` |

If a device shows as offline or an address does not answer: `docker compose -f compose.funnel.yaml logs --tail 50`
and send the output (it contains no secret) without the `.env`.

## For developers: testing without GitHub

`bash infra/server/test/smoke-funnel.sh` checks the public-access ingress (ports, Host rewrite, password, headers) without
Tailscale. `bash infra/server/test/smoke-deploy.sh` (needs Docker and the image `upwilling-web:local`) runs the agent against a
throwaway local registry: first deploy, next release, a bad release refused and the previous one restored, then a
rollback. It uses test names, so it is safe next to the real stacks. CI runs it in the `docker` job.
