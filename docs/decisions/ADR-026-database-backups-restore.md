# ADR-026 — Encrypted database backups and restores into recette

- Status: **Proposed** (Task 1.6a, 2026-11-01; plan approved by the supervisor, "Go 1.6a")
- Date: 2026-11-01
- Relates to: ADR-005 (PostgreSQL), ADR-008 (backups on R2, amended here for the test phase), ADR-017 (recette),
  ADR-024 (deploys), ADR-025 (the laptop as the server), TR-08 (retention)
- Sources checked 2026-11-01: rclone releases (v1.75.2) and docs (S3 backend, `serve s3`, environment variables),
  Cloudflare docs (R2 pricing, get started, rclone example), age releases (v1.3.2) and advisories, Debian trixie
  package index (age 1.2.1, rclone 1.60.1), PostgreSQL 18 docs (`cluster_name`), plus a live check that
  `SHOW cluster_name` answers a client on `postgres:18.6-trixie`

## Context

Milestone 1 ends with a backup that can really be restored. The roadmap asks for nightly encrypted `pg_dump`s of the
production databases to R2 and a restore into recette. Today (supervisor, 2026-10-20 and 2026-10-26):

- there is no bank card, and R2 needs a subscription through a checkout, so R2 may not be available yet;
- the supervisor's laptop is the server, and Docker Desktop runs only while they work: often off at night;
- only recette runs, and it has no application tables before Task 3.1;
- the repository is public, and the image and every workflow log with it.

## Decision

- **Own Compose project** `upwilling-backup` (`infra/server/compose.backup.yaml`) with its own small image, built on
  the server from `infra/server/backup/`. The deploy agent's `--remove-orphans` never touches it, and a failing backup
  cannot block a deploy. It joins the source stack's network and has **no Docker socket**.
- **Streamed pipeline:** `pg_dump --format custom | age | rclone rcat`. No plain dump touches a disk. The image is
  `postgres:18.6-trixie` (the database's own digest, so `pg_dump` always matches the server; the smoke test fails if
  the two drift apart) + Debian's `age` + rclone's static binary.
- **Public-key encryption (age, X25519):** the server holds only the public key, so it can write backups but cannot
  read them. The private key stays with the humans, off the server, and is mounted only for a restore.
- **Interval with catch-up instead of a fixed hour:** every `BACKUP_POLL_SECONDS` (5 minutes) the container looks at
  the destination, and a database whose newest backup is older than `BACKUP_INTERVAL_HOURS` (24) gets a new one.
  On an always-on server this is a backup a day; on the laptop it runs shortly after Docker starts.
- **Any rclone path as the destination.** Test phase: a local folder, `C:\upwilling-server\backups`, on the host and
  not in a Docker volume. **This amends ADR-008 for the test phase only.** R2 needs configuration only
  (`docs/integrations/r2.md`); the S3 path is tested against rclone's S3 server.
- **Backups cannot erase themselves:** a backup gets its final name only after a complete upload; retention (35 days,
  TR-08, to confirm with the PO) runs only after a whole round succeeded and only on that stack's backups.
- **Restores only go into recette, and the server decides.** `compose.recette.yaml` starts Postgres with
  `cluster_name=recette` (`production` in the production stack); `restore.sh` asks the server and refuses any other
  answer, including an empty one. The restore service also only has recette's network and password, but those are
  client configuration that a mistake could change; a server's own name is not.
- **A bad backup leaves recette as it was:** `restore.sh apply` first decrypts the backup to its last byte, then
  restores into a scratch database in one transaction, and replaces the real database only after that succeeded.
  `restore.sh check` is the dry run (02 §17).
- **Test-phase source: recette.** It holds a synthetic proof table, as production does not exist yet.

## Consequences

- **In the test phase, backups are not off-site.** The folder is on the same laptop as the database: this proves the
  process, and it would not survive losing the laptop. Acceptable with synthetic data only. **R2 (or another off-site
  destination) is mandatory before any real data.**
- Losing the private key makes every backup unreadable: it needs a safe place outside the server (runbook §1) and a
  second holder before real data exist (PO).
- No alert yet: a failing backup shows only as an `unhealthy` container and in its log. Sentry and the uptime monitor
  (Tasks 1.6b, 1.6c) do not cover it by themselves; alerting on this health state stays open.
- Once production holds real data, a restore test copies real personal data into recette. Whether and how that is
  allowed (who may see it, deleted when) is a PO decision to take **before** the first such restore.
- Dumps run as the Postgres superuser, and restores use `--no-owner`, because the app has no role of its own yet.
  Task 3.1 must add a backup role, decide how roles are restored (`pg_dump` does not contain them), and wire the
  pre-migration backup of 03 §10 into the deploy agent.
- `cluster_name` is new in both stacks: the first deploy after this change recreates recette's Postgres container
  (the data volume stays). Restores are refused until then.
- The Dockerfile's digest must follow `compose.base.yaml` when Postgres is updated (the smoke test enforces it).
- The backup image inherits an unused anonymous volume from the Postgres image's `VOLUME` line.
- Real R2 and the arm64 build are untested: no account yet, and no arm64 emulation on the local machine. CI builds
  the image on amd64 only.

## Alternatives not chosen

- pgBackRest or WAL archiving: point-in-time recovery is more than the roadmap asks for, and much heavier to run.
- Fixed-hour cron: misses every night the laptop is off.
- Backups from the deploy agent: it has the Docker socket; the backup should have less, not more.
- GnuPG: already in the image, but its keyrings are a lot of machinery for one recipient.
- Debian's rclone: 1.60.1, three years behind.
- age 1.3.2 from GitHub: per-architecture downloads to verify by hand, for no feature we use. 1.2.1 has the last
  published security fix (GHSA-32gq-x56h-299c), and Debian maintains it.
- Publishing the image to GHCR: nothing else needs it, and the build is small.
- Dropping the database in place before restoring: simpler, but a bad backup would leave recette empty.

## Revisit when

- Task 3.1 (roles, migrations), or real personal data are planned (off-site destination, second key holder, the
  restore rule above), or the domain and a real server exist (move to R2, then a fixed quiet hour may be preferred).
