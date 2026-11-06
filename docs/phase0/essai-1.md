# Essai 1 — Deployment chain and holding pages

- Phase 0, Essai 1 (*Phase 0 — Analyse et décision*, §4). Roadmap milestone M1, Task 1.7. Written 2026-11-06.
- **Result: conclusive for its success criterion.** A merged change reaches recette with no manual step: three merges
  in a row did (PRs #16, #17, #18). Two limits: the test-phase server is the supervisor's laptop, not a VPS, and
  production deploys by approval have not run live.
- VLAB is out of scope (ADR-015), so the source's "three sites" are two sites plus the back-office here.

## The five questions

| Question (source, §4) | Answer | Evidence |
|---|---|---|
| Is the monorepo skeleton (Turborepo) in place, with `apps/web`, `apps/vlab` and `packages/`? | **Yes, without `apps/vlab`** (ADR-015). pnpm workspace + Turborepo: `apps/web`, `packages/config`, `packages/design-system`. | Task 0.2, ADR-001 |
| Does the server run Next.js, PostgreSQL and VLAB with Docker? | **Next.js and PostgreSQL, yes, on the test-phase server: the supervisor's laptop.** One image runs every role (two sites, back-office, worker), next to PostgreSQL 18, per stack. No VPS yet: Oracle's free VM needs a bank card (ADR-021). | Tasks 1.1b, 1.4, ADR-024 |
| Do the three recette addresses answer over HTTPS, each with its brand's page? | **Yes for the two sites and the back-office, on temporary `*.ts.net` names**, behind a password and `noindex`. The planned `recette*.upwilling.fr` names wait for the domain. | Tasks 1.2, 1.5c, ADR-022, ADR-025 |
| Is a change merged on GitHub deployed to recette automatically? | **Yes.** PR #16 on 2026-10-26, PR #17 on 2026-11-01, PR #18 on 2026-11-06 in 5 min 47 s from merge to live. PR #17's first CI run failed on a race in a test, so it deployed only after a re-run; PR #18 fixed that race. | Task 1.5b, ADR-024 |
| Can a database backup really be restored? | **Yes**, on 2026-11-01, into the real recette: a synthetic row was backed up, deleted, restored and seen again. The backups stay on the laptop for now, so they are not off-site. | Task 1.6a, ADR-026 |

## The procedure (the one-page note)

**A change goes live** (nobody touches the server):

1. A pull request to `develop` runs CI: format, types, lint, 230 tests, build, end-to-end tests, secret scan, shell
   checks, the Docker image on both architectures, and five smoke tests of the containers and stacks.
2. The merge reruns CI on `develop`, publishes the image to GHCR tagged with the commit, and moves the image tag
   `recette` to it.
3. The deploy agent on the server checks that tag every minute. When it moves, the agent starts the new release,
   waits until every container is healthy, and checks `/api/ready` and `/api/version`. If anything fails, it starts
   the previous release again.
4. Check: `https://upwilling-recette.tail3810a7.ts.net/api/version` shows the merged commit. It stays open without the
   password so CI can check it.

**Roll back:** GitHub → Actions → **Rollback** → Run workflow from `develop`, stack `recette`, and the full commit SHA
to go back to. The agent deploys it within a minute. The database is never rolled back automatically. Production works
the same way from `main`, after the supervisor's approval. Runbook: `docs/runbooks/local-server.md` §6.

**Back up:** automatic. Once a day the backup container dumps every database of the stack, encrypts it with a public
key, and keeps it 35 days. It catches up within minutes of Docker starting, as the laptop is off at night. Take one now:
`docker compose -f compose.backup.yaml run --rm backup once`, in `C:\upwilling-server\backup`.

**Restore** (recette only: the server itself has to say it is recette): `restore list`, then `restore check <backup>`
(the dry run), then `restore apply <backup>`, with the private key mounted for the command. Runbook:
`docs/runbooks/backup-restore.md` §4.

## What is proven, and how

| Part | Proven live | Proven in tests only | Not done yet |
|---|---|---|---|
| Merge → recette, no manual step | ✔ three times | ✔ | |
| Failed release → previous one restored | | ✔ `smoke-deploy.sh` | |
| Rollback by workflow | ✔ drill on 2026-11-06: back one release and forward again, served 71 s and 72 s after the click | ✔ `smoke-deploy.sh` | |
| Production after approval | | | ✘ never run: no production stack, `develop → main` not promoted |
| Backup and restore | ✔ 2026-11-01 | ✔ `smoke-backup.sh` | ✘ off-site copy (R2) |
| HTTPS, password, `noindex` on recette | ✔ through Tailscale Funnel | ✔ `smoke-funnel.sh` | |
| Edge for the real server: Cloudflare + Caddy | | ✔ `smoke-stacks.sh` | ✘ never on a real server |
| Server scripts (Ubuntu, firewall, Docker) | | ✔ in a test container, run by hand (not in CI) | ✘ never on a real server |
| arm64 (the Oracle VM) | | App image built and checked | ✘ stacks and backup image never run on arm64 |
| Error tracking, uptime alerts | | | ✘ Tasks 1.6b, 1.6c |

## Memory in use (idle, measured 2026-11-06 on the laptop)

One reading with `docker stats`, no visitors. Docker's VM has 7.8 GiB and 4 CPUs; every container used under 0.1 % CPU.

| Container | In use | Limit |
|---|---|---|
| Recette: academy site | 49 MiB | 320 MiB |
| Recette: Career Boost site | 47 MiB | 320 MiB |
| Recette: back-office (cms) | 47 MiB | 320 MiB |
| Recette: worker | 23 MiB | 256 MiB |
| Recette: PostgreSQL | 43 MiB | 640 MiB |
| **Recette stack** | **210 MiB** | |
| Deploy agent | 51 MiB | 128 MiB |
| Public access: ingress Caddy + 3 Tailscale devices (test phase only) | 113 MiB | 64 + 3 × 128 MiB |
| Backups (1 MiB for the program; the rest is file cache the system can reclaim) | 62 MiB | 256 MiB |
| **Everything on the server** | **436 MiB** | |

Production would add a stack of about the same size, and the real server's edge Caddy measured 14 MiB in Task 1.4.
Both stacks fit easily in the planned 8 GB server at idle. Behaviour under load was not measured.

## Issues met

- **No bank card, so no server.** Oracle's free VM was the plan (ADR-021) and is blocked. The laptop became the server
  (ADR-024), with outbound-only public access through Tailscale Funnel (ADR-025). This works for demos and tests, not
  for real traffic: recette is offline whenever Docker Desktop is.
- **Docker Desktop is often off** (at night, and when the laptop overheats). Deploys catch up when it starts, the
  deploy check only warns, and backups were designed to catch up too (interval instead of a fixed hour).
- **Docker starts everything at once.** On 2026-11-05 the first backup ran while PostgreSQL was still starting, and
  failed. The retry 5 minutes later succeeded, as designed. Waiting for the database before the first attempt would
  avoid the false alarm in the log.
- **A race in the tests blocked a deploy once** (`grep -q` under `pipefail` turned a found header into a missing one).
  Reproduced and fixed in all five smoke tests (PR #18).
- **The quality gate (SonarCloud) caught two shortcuts in a test**: a world-writable folder and plain HTTP to a
  stand-in. Both were fixed rather than marked as safe.
- **Tailscale's relay needed its own rule** in the tailnet policy before outside visitors could connect (ADR-025).
- **`main` received Task 0.1 by mistake** (PR #2), so promoting `develop` now conflicts in 7 files (see below).
- No arm64 emulation on the laptop, and Next.js's standalone server cannot run natively on Windows: both are tested in
  containers or CI instead.

## Effort compared with the 2-day cap

The cap is for one human developer. Here an AI agent did the work in five sessions between 2026-10-18 and 2026-11-06,
with the supervisor reviewing every step. Developer-days were not measured, so the cap cannot be compared directly.
The 19 calendar days include the gaps between sessions, so they do not measure the effort either.

## Proposal: promote `develop` to `main`

The infrastructure baseline is ready to promote, as a merge commit after the supervisor's approval (03 §2). Before
that, one step is needed. `main` holds its own copy of Task 0.1 (PR #2), byte-for-byte identical to `develop`'s (same
parent, same files), so merging `main` into `develop` with the `ours` strategy, through a pull request, records it
without changing a file. That pull request must be merged as a merge commit: a squash would drop the link to `main`'s
commit, and the conflicts would remain. After that, `develop → main` merges cleanly.

The promotion only moves the `production` image tag once the supervisor approves. The laptop runs recette only, so
nothing would start. Running production on the laptop as well (runbook `local-server.md` §7) is possible, but it adds a
second stack to a machine that already overheats. Proposal: promote now so `main` matches `develop`, and run production
for the first time on the real server.

## Before real data or real visitors

From the ADRs; none of this blocks Essai 2:

- a real server and the domain (ADR-021, ADR-022), then the Cloudflare edge (ADR-023) instead of Tailscale Funnel;
- off-site backups (R2) and a second holder of the private key (ADR-026);
- error tracking and uptime alerts (Tasks 1.6b, 1.6c), and an alert on failing backups;
- a PO rule for restoring real data into recette (ADR-026).
