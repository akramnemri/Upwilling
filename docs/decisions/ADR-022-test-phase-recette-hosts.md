# ADR-022 — Test-phase recette hosts under upwilling.fr

- Status: Accepted for the test phase (supervisor, 2026-10-20: "we will host for free for testing purposes and move
  to recette domain when we start accepting traffic")
- Date: 2026-10-20
- Amends: ADR-017 (recette on a separate registrable domain) until the sites accept real traffic. Pairs with ADR-021.
- Source checked 2026-10-20: Cloudflare Universal SSL limitations (covers the apex and first-level subdomains only).

## Context

ADR-017 puts recette on a separate registrable domain so that production session cookies (set on `.upwilling.fr`,
ADR-006) never reach recette. That domain costs about €10 a year, and the organization does not want to spend
before accepting traffic. During the test phase there are no production users and no real data (ADR-021), so
no production session cookie exists yet.

## Decision

- Until the sites accept real traffic, recette uses **first-level** hosts of `upwilling.fr`. Cloudflare's free
  certificate does not cover deeper names such as `admin.recette.upwilling.fr`.

  | Recette host (test phase) | Serves | Later (ADR-017 domain) |
  |---|---|---|
  | `recette.upwilling.fr` | academy site | `<recette-domain>` |
  | `recette-careerboost.upwilling.fr` | Career Boost site | `careerboost.<recette-domain>` |
  | `recette-admin.upwilling.fr` | admin (Cloudflare Access) | `admin.<recette-domain>` |
  | `recette-hooks.upwilling.fr` | webhooks only | `hooks.<recette-domain>` |
  | `recette-stats.upwilling.fr` | Umami (from Task 5.8, Cloudflare Access) | `stats.<recette-domain>` |

- Recette keeps every other ADR-017 protection: noindex everywhere, basic auth or Cloudflare Access, its own compose
  project, database, volumes and secrets.
- While recette lives under `upwilling.fr`, **no cookie may be set with `Domain=.upwilling.fr`** by either stack:
  sessions stay host-only. Shared sessions across the two sites can therefore not be tested on recette until the move.
- **Hard switch, before accepting traffic** (with the move to a paid VPS, ADR-021): buy the recette domain, move the
  recette hosts there, delete the `recette*.upwilling.fr` DNS records and remove them from the app's host allowlist.
  No real user account may exist on production before that.

## Consequences

- €0 for domains during the test phase.
- The cookie isolation of ADR-017 is replaced by a rule ("host-only cookies, no real users") that must be respected
  until the switch; Task 3.4 (public accounts) must check it.
- Task 1.4 adds these hosts to the `recette` host allowlist (`apps/web/src/modules/core/tenancy/hosts.ts`) and to Caddy.

## Revisit when

- The organization decides to accept traffic (do the hard switch first).
- Shared sessions across sites need testing earlier than that (then buy the recette domain earlier).
