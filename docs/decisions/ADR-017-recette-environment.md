# ADR-017 — Recette on the same VPS, isolated, on a separate registrable domain

- Status: Accepted (recette domain to be chosen and bought by the human). Amended by ADR-022: during the test phase,
  recette uses first-level hosts of upwilling.fr; the separate domain comes before accepting traffic.
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §5.2, §16

## Context

We need a staging environment (recette) for the team and the PO without paying for a second server.
The production session cookie is set on `.upwilling.fr` (ADR-006).

## Decision

- Recette runs on the production VPS as a separate compose project (`upwilling-recette`) with its own
  database container, volumes, secrets and lower memory limits (about 60 % of production).
- Recette uses a **separate registrable domain** (example: `upwilling-recette.fr`), never a `*.upwilling.fr` host,
  so production session cookies never reach it.
- All recette hosts send `X-Robots-Tag: noindex, nofollow` and are protected by basic auth or Cloudflare Access.

## Consequences

- Cheapest option; recette load shares the VPS with production.
- Cross-site shared sessions can only be verified on recette (cookies are host-only locally).

## Revisit when

Recette load disturbs production.
