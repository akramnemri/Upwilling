# ADR-006 — Accounts: Payload `users`, session cookie on `.upwilling.fr`, admin behind Cloudflare Access

- Status: Accepted (PO/legal decision on shared accounts across two legal entities pending)
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §8

## Context

Visitors should have one account across both sites (Stratégie §8). VLAB, later, must be able to verify the
same session. The academy and the association are two legal entities.

## Decision

- Accounts live in Payload's built-in `users` collection (not tenant-scoped). Roles: `superAdmin`,
  `staff` (`editor`/`manager` per tenant), `trainer`, public account.
- Session cookie: `Domain=.upwilling.fr` in production, host-only locally, `HttpOnly`, `Secure`, `SameSite=Lax`.
  CSRF origin allowlist, login rate limiting and lockout, email verification before any payment,
  minimum password length 12.
- The admin host is protected by Cloudflare Access in addition to Payload login.
- Default until the PO decides: shared credentials and basic profile; tenant-specific data (orders,
  memberships, donations) visible only to that tenant's staff.

## Consequences

- No separate identity service to run.
- Recette must use a separate registrable domain so production cookies never reach it (ADR-017).
- Payload has no built-in second factor; Cloudflare Access covers the admin until a verified option exists.

## Revisit when

VLAB integration (needs asymmetric tokens verified locally), or the PO/legal decision on shared accounts.
