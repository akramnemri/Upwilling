# ADR-002 — One Next.js + Payload 3 application serves both sites (multi-tenant)

- Status: Accepted (to be confirmed by Essai 4, Milestone 3)
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §6

## Context

`upwilling.fr` (academy) and `careerboost.upwilling.fr` (association) need content management,
shared accounts (Stratégie §8) and a common design system. The team is small; maintaining two
applications and two admin panels doubles the upgrade and security work.

## Decision

A single Next.js application with Payload CMS 3 embedded (`apps/web`) serves both sites.
The tenant is resolved from the request host only, through a static validated host→tenant map.
Content is separated with Payload's official multi-tenant plugin; `users` and `tenants` are global.

## Consequences

- One codebase, one admin, one account system shared by both sites.
- Tenant isolation becomes a security property of the code: every tenant-scoped collection needs
  an isolation test (read/create/update/delete across tenants must fail).
- A bug in shared code can affect both sites; fault isolation is handled at runtime by separate
  containers (ADR-004).

## Revisit when

Essai 4 (Task 3.6) shows the multi-tenant plugin cannot express a required rule, or isolation cannot be
tested reliably. Fallback: two apps in the same monorepo sharing the packages.
