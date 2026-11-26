# ADR-008 — Media, private files and backups on Cloudflare R2; stateless app containers

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §9

## Context

Files stored on the container file system would be lost on redeploy and would block running replicas.
Some files are private (course materials, invoices, CVs, trainer documents).

## Decision

- Public media go to an R2 bucket through Payload's storage adapter.
- Private files go to a separate private bucket and are served through short-lived signed URLs after an
  access check.
- Database backups are encrypted and uploaded to R2 (retention 35 days, to confirm with the PO, TR-08).
- App containers keep no persistent state.

## Consequences

- Containers can be replaced or replicated freely.
- R2 credentials are environment variables; creating buckets and keys is a human action.
- Local development needs an R2-compatible emulation or a local storage fallback (decided in Task 3.1).

## Update 2026-11-25 — Task 3.1: local storage until the Cloudflare account exists

- The R2 adapter is `@payloadcms/storage-s3` (R2 speaks the S3 API, `region: auto`). It is wired for the public
  `media` collection and turns on only when the four variables `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET` are set (all or none, checked at startup).
- Without them, uploads go to `MEDIA_DIR` (default `apps/web/media`, gitignored, never in the image). This is the
  **local fallback** this ADR left to Task 3.1. No S3 emulator (MinIO, LocalStack): one container less on the laptop.
- `alwaysInsertFields: true`: the adapter's `prefix` column exists with or without R2, so one set of migrations
  fits every environment.
- The **private bucket** is not wired yet: no collection holds private files before the LMS and the forms. The
  first such collection adds it, with signed URLs after an access check.
- **Temporary exception, Task 3.1b:** the recette `cms` container gets a named volume for `MEDIA_DIR` until R2
  exists (containers are otherwise stateless). Production does not go live without R2.

## Revisit when

No foreseen trigger.

## Update 2026-11-25 — Task 3.1b: recette media volume, R2 required in production

- Recette's `cms` writes uploads to the named volume `media` (`MEDIA_DIR=/data/media`; the image creates
  `/data/media` owned by `node`). Recette data is synthetic: the volume is not backed up.
- Production's `cms` refuses to start without the four `R2_*` variables (startup validation and
  `compose.production.yaml`): production media never live in a container (supervisor's choice, 2026-11-25).
