# ADR-003 — One VPS with Docker Compose, Caddy and Cloudflare in front

- Status: Accepted. Amended by ADR-021: during the test phase the server is an Oracle Cloud Always Free VM.
- Date: 2026-10-18
- Source: `docs/ai/01_ARCHITECTURE.md` §3, §5

## Context

Both sites are commercial (training sales, memberships, donations), which excludes free PaaS tiers.
Traffic is low at launch and the monthly budget must stay small. Several containers are needed (ADR-004).

## Decision

One VPS with at least 8 GB RAM runs Docker Engine and Docker Compose. Caddy is the only container
exposing ports 80/443 and routes by host. Cloudflare provides DNS, CDN for static assets and
Cloudflare Access for the admin and stats hosts. Production and recette are separate compose projects
on the same VPS (ADR-017).

## Consequences

- Cheapest controllable option; full control over containers and data location.
- The VPS is a single point of failure: accepted at launch, mitigated by off-site backups (ADR-008),
  an external uptime monitor (ADR-013) and a tested restore procedure.
- Server provisioning, OS updates and hardening are our responsibility (runbooks in `docs/runbooks/`).
- Buying and configuring the VPS, domains and DNS are human-only actions.

## Revisit when

Traffic or availability requirements grow beyond what one VPS provides, or VLAB needs its own server.
