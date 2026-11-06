# ADR-021 — Test-phase hosting: Oracle Cloud Always Free Arm VM

- Status: Accepted for the test phase (supervisor, 2026-10-20: "you can use oracle")
- Date: 2026-10-20
- Amends: ADR-003 (one VPS) until the sites accept real traffic. Builds on ADR-020 (server baseline).
- Sources checked 2026-10-20: Oracle "Always Free Resources" and Compute "Essential Firewall Rules" / known issues
  pages; 2026 free-hosting comparisons (Render, Koyeb, Fly.io, Google Cloud e2-micro).

## Context

Buying the VPS is postponed until the organization decides to accept traffic. We still need a server to build
and test the deployment chain (M1: compose, Caddy, deployments, backups). Our stack needs several containers
(web ×2, cms, worker, Postgres, Caddy), so single-service PaaS free tiers (Render, Koyeb) do not fit, Fly.io has
no free tier for new accounts, and a Google e2-micro has 1 GB RAM.

Oracle Cloud Always Free offers an Arm VM (Ampere A1) with **2 OCPU and 12 GB RAM** (halved in June 2026 without
announcement), 200 GB of block storage and 10 TB/month of outbound data.

## Decision

- During the test phase, the "single VPS" of ADR-003 is one Oracle Cloud Always Free VM:
  shape `VM.Standard.A1.Flex` with the whole free allowance (2 OCPU, 12 GB), Canonical Ubuntu 26.04 LTS
  (or 24.04), aarch64, in an **EU home region** (Paris, Marseille or Frankfurt).
- Same architecture and scripts as ADR-020: Docker Compose, Caddy, Cloudflare in front, `provision.sh`.
- Firewall on Oracle:
  - the **VCN security list** is the outer firewall: ingress TCP 22, 80, 443 only. It is also the only firewall
    in front of ports published by Docker;
  - on the host, Oracle's own iptables rules stay, and `provision.sh` inserts ACCEPT rules for 80/443.
    **Never ufw**: Oracle documents that ufw can remove its essential rules and stop the instance from booting.
- The app image must exist for **linux/arm64**: Task 1.5 builds it (the Node base image is multi-arch).
- **Synthetic data only** on this server, recette and production stacks alike: no real personal data, no live payments.
- **Before accepting real traffic** (Career Boost launch, Task 5.9), move to a paid EU VPS as planned in ADR-003,
  unless a new ADR decides otherwise. Moving means: new server, same scripts, restore from backup (Task 1.6).

## Consequences

- €0 hosting while we build M1–M4; the runbooks stay valid for the paid VPS.
- Oracle may reclaim an Always Free instance that is idle for 7 days: CPU (95th percentile), network and memory all
  under 20%. A quiet test stack can match that. Mitigations: upgrade the tenancy to Pay As You Go (still €0 inside
  the free allowance; community reports say it ends idle reclamation, to be confirmed with Oracle at sign-up) with a
  budget alert; off-site backups (Task 1.6) anyway.
- Oracle can change the free allowance without notice (it did in June 2026): the 12 GB is not guaranteed.
- No SLA; "out of capacity" errors are common in popular regions when creating the VM.
- Every image we run must have an arm64 variant (Caddy, Postgres and Umami official images do). Local machines are
  amd64, so CI builds both architectures.
- Human-only steps: Oracle account (card verification), region, network, VM (runbook `server-setup.md` §11).

## Revisit when

- The organization decides to accept traffic (move to a paid VPS before that).
- Oracle reclaims the VM, changes the allowance again, or capacity blocks the setup.
- The stack no longer fits in 12 GB.
