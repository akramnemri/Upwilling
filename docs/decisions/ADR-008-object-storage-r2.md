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

## Revisit when

No foreseen trigger.
