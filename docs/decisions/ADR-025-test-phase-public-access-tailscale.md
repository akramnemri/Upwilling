# ADR-025 — Test-phase public access to recette through Tailscale Funnel

- Status: Proposed (Task 1.5c; the approach was accepted with the supervisor's "go" on 2026-10-20 and 2026-10-26)
- Date: 2026-10-26
- Relates to: ADR-022 (test-phase recette hosts), ADR-023 (edge TLS, kept for the real server), ADR-024 (deploys)
- Sources checked 2026-10-26: Tailscale docs (Funnel, Docker parameters, policy syntax), Tailscale source v1.104.2
  (`cmd/containerboot/serve.go`: `${TS_CERT_DOMAIN}` substitution and file watching; `ipn/ipnlocal/serve.go`:
  the proxy keeps the Host header and adds `X-Forwarded-*`)

## Context

The domain and the server are not ready (supervisor, 2026-10-20). Recette runs on the supervisor's laptop
(ADR-024), behind a home router. The team and the PO must reach it; the only constraint is "free, no bank card".
The app answers only its allowlisted hosts (`recette.upwilling.fr` etc., ADR-022), and no DNS points there yet.

## Decision

- **Tailscale Funnel** (free Personal plan) publishes three HTTPS names `https://<device>.<tailnet>.ts.net`:
  `upwilling-recette` (academy), `careerboost-recette`, `admin-recette`. One Tailscale container per name
  (`infra/server/compose.funnel.yaml`), tagged `tag:upwilling-recette`, userspace networking, no capability.
  Connections are outbound only: no router change, no published port.
- Each device forwards to its own port of a local Caddy (`ingress`, `caddy/Caddyfile.funnel`), which adds basic
  auth (ADR-017), the edge's security headers and `X-Robots-Tag`, and **replaces the Host with the site's ADR-022
  recette host**, so the app and its allowlist do not change. `/api/version` stays open (a public commit SHA) so
  the promote workflow can confirm a deploy; that check warns instead of failing, as the laptop may be off.
- The tailnet policy gives the Funnel attribute to `tag:upwilling-recette` only, and lets only tailnet members
  (not tagged devices) open connections: a compromised container cannot reach the laptop through Tailscale.
- No webhook host yet: nothing calls webhooks before the payment work.
- **The agent may run setup steps on the supervisor's laptop when asked** (supervisor, 2026-10-26: "can you set it
  up for me?"). This exception to CLAUDE.md's "infra changes are files + runbooks; the human executes them"
  covers the local test-phase server only, never a real server, and never entering a secret the human holds
  (the Tailscale key is written into `.env` by the supervisor).

## Consequences

- Recette is public (behind its password) only while the laptop runs. Funnel is in beta with unpublished
  bandwidth limits: fine for demos, not for load.
- Enabling HTTPS certificates publishes the device names in Certificate Transparency logs; the public URL is also
  visible in the promote workflow's public log. Neither is secret; the password protects recette.
- Absolute URLs the app builds from its own host would name `recette*.upwilling.fr`; none exist today (no auth or
  redirects yet). Check this when Task 3.4 (accounts) adds redirects.
- The `Server: Caddy` header is removed from proxied responses but not from Caddy's own 401 page (minor).
- Everything in this ADR is removed when the domain and a real server exist: the edge Caddy (ADR-023) and DNS
  take over, and `compose.funnel.yaml`, `Caddyfile.funnel` and `tailscale/` are deleted.

## Alternatives not chosen

- Cloudflare Tunnel: needs a domain in a Cloudflare account (not available yet).
- ngrok (free): one name only and an interstitial warning page for visitors.
- Router port forwarding + dynamic DNS: needs router access and a public IP, and exposes the home address.
- Adding `*.ts.net` names to the app's allowlist: a core security change for a temporary setup; the Host rewrite
  keeps the app untouched.

## Revisit when

- The domain and a server exist (remove this setup), or several people need recette daily while the laptop is off.
