# ADR-023 — Edge: TLS between Cloudflare and Caddy, origin locked to Cloudflare

- Status: **Accepted** (supervisor, 2026-10-20; proposed in Task 1.4)
- Date: 2026-10-20
- Relates to: ADR-003 (one VPS, Caddy, Cloudflare), ADR-017/ADR-022 (recette hosts), ADR-020 (server baseline:
  "restricting 80/443 to Cloudflare, reconsider with the TLS decision of Task 1.4")
- Sources checked 2026-10-20: Cloudflare docs "Origin CA certificates" and "Zone-level Authenticated Origin Pulls";
  Caddy docs (global options, `tls`, `basic_auth`, `request_body`); Docker Hub `caddy` image page;
  Cloudflare IP list (https://www.cloudflare.com/ips/)

## Context

Every public record is proxied by Cloudflare with SSL mode **Full (strict)** (`docs/runbooks/cloudflare-dns.md`).
Caddy therefore needs a certificate Cloudflare trusts for every host. The admin hosts are protected by
Cloudflare Access. If someone finds the server's IP, they must not be able to bypass Cloudflare (and Access)
by talking to the origin directly. Docker-published ports bypass ufw (ADR-020), so restricting by source IP
needs `DOCKER-USER` rules kept in sync with Cloudflare's list.

Options for the certificate:

1. **Cloudflare Origin CA certificate**: free, issued in the dashboard, covers `upwilling.fr` and `*.upwilling.fr`,
   long validity, trusted only by Cloudflare. Caddy loads two files; the stock image works.
2. **Let's Encrypt with the DNS-01 challenge**: publicly trusted, renewed automatically, but needs a custom Caddy
   build (`caddy-dns/cloudflare` plugin) and a Cloudflare API token with DNS edit rights stored on the server.
3. **Let's Encrypt with HTTP-01/TLS-ALPN-01 behind the proxy**: works only with extra Cloudflare rules, and breaks in
   confusing ways. Not considered further.

## Decision

- **TLS: Cloudflare Origin CA certificate** (option 1) for the `upwilling.fr` zone, RSA or ECC, files
  `origin.pem` + `origin.key` in `/srv/upwilling-edge/certs/` (mode 600, owner `deploy`). Caddy: `auto_https off`,
  no ACME, stock image `caddy:2.11.7-alpine` pinned by digest (ADR-018).
- **Origin locked to Cloudflare by zone-level Authenticated Origin Pulls** (mutual TLS): we create our own small CA,
  upload its client certificate to Cloudflare (zone-level AOP), and Caddy requires a client certificate signed by
  that CA (`client_auth require_and_verify`, CA file `origin-pull-ca.pem`). Zone-level AOP with our own CA, not the
  global Cloudflare certificate shared by all Cloudflare customers. With client auth on, Caddy also enforces
  that the TLS name matches the `Host` header (strict SNI). No IP allowlist to maintain.
- **Ports:** Caddy publishes **443 only**. Cloudflare never contacts the origin on port 80 in Full (strict), and no
  ACME challenge needs it. HTTP->HTTPS is Cloudflare's "Always Use HTTPS". No HTTP/3 (the firewall opens TCP only).
  Inside the container Caddy runs as the `deploy` uid on port 8443, read-only, every capability dropped except
  `NET_BIND_SERVICE` (the image's binary carries it as a file capability and will not start without it).
- **Client IP:** `trusted_proxies` = Cloudflare's published ranges, client IP from `CF-Connecting-IP`.
- **Topology:** Caddy is its own compose project (`upwilling-edge`) because one container must serve both stacks.
  It owns two internal networks (`upwilling-edge-prod`, `upwilling-edge-recette`); each stack's web and cms
  containers join their own one with prefixed aliases (`prod-*`, `recette-*`), so Caddy never resolves an
  ambiguous service name and recette containers cannot resolve production ones.
- **Headers set by Caddy:** `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy`; `Server` and `X-Powered-By` removed; `X-Robots-Tag: noindex, nofollow` on recette.
  **No HSTS yet** (enabled at each site's launch, Task 5.9 / 9.5). The Content-Security-Policy belongs to the app
  (nonces), later.
- **Recette protection:** basic auth (bcrypt hash in `/srv/upwilling-edge/.env`) on every recette host except
  `recette-hooks` (providers cannot send it); on `recette-admin` it stands in until Cloudflare Access is set up
  (supervisor, 2026-10-20).

## Consequences

- Visitors only ever see Cloudflare's public certificate. A record switched to "DNS only" by mistake shows a
  certificate error instead of silently exposing the origin.
- Cloudflare sends no expiry reminders for origin certificates: the expiry dates (origin certificate, origin-pull CA
  and client certificate) are written in the password manager entry and checked in the monthly maintenance pass.
- Cloudflare's IP ranges change rarely; a stale list only affects logged client IPs, not access (AOP does that).
- The recette domain move (ADR-017, before accepting traffic) needs a second origin certificate for the new zone
  and AOP enabled on that zone too; the Caddyfile then gets a second `tls` file pair.
- Port 80 stays open in the firewalls of Task 1.3 but nothing listens on it. Closing it is optional.
- Local and CI tests use throwaway self-signed stand-ins for all three certificates (`smoke-stacks.sh`).

## Alternatives not chosen

- Let's Encrypt via DNS-01 (option 2): a secret with DNS edit rights on the server and a custom Caddy build, for a
  certificate only Cloudflare sees.
- Restricting 443 to Cloudflare IP ranges with `DOCKER-USER` iptables rules: a list to keep in sync, interacts with
  Oracle's iptables setup (ADR-021), and Docker's userland proxy can hide the real source address on IPv6.
- Cloudflare Tunnel (`cloudflared`): no open port at all, but one more moving part and a different deploy model
  than ADR-003; worth reconsidering if the server ever has to sit behind NAT.

## Revisit when

- The recette domain is bought (second zone), or Cloudflare stops proxying any host.
- The site needs to be reachable without Cloudflare (then a publicly trusted certificate is required).
