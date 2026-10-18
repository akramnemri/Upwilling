# ADR-015 — VLAB is out of scope; integration contract reserved

- Status: Accepted
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §15

## Context

VLAB (`vlab.upwilling.fr`, remote access to embedded hardware) needs a redesign before any integration.
Essai 3 and VL-01…VL-06 are postponed; the PO has been informed.

## Decision

- Do not create `apps/vlab`, import VLAB code, design VLAB screens or write integration code.
- Reserved so integration stays easy later: hostname `vlab.upwilling.fr`, session cookie on `.upwilling.fr`,
  a future `packages/auth` for local token verification, a disabled "VLAB lab" lesson block,
  reserved analytics event names.

## Consequences

- Phase 0 Essai 1 and Essai 2 run without VLAB.

## Revisit when

The VLAB redesign is done.
