# Runbook — Cloudflare DNS and TLS settings (Task 1.3) [HUMAN]

- Who: the supervisor, in the Cloudflare dashboard. The agent never has Cloudflare credentials.
- When: zone settings now; each record at the task named in its "When" column. Changing a record too early
  can take a live page offline (`upwilling.fr` still serves the current WordPress page).
- Architecture: 01_ARCHITECTURE.md §5.2 (hosts), ADR-003, ADR-017. TLS between Cloudflare and Caddy: decided in Task 1.4.

## 1. Zone settings (both zones: `upwilling.fr` and the recette domain)

| Setting | Value | Why |
|---|---|---|
| SSL/TLS encryption mode | **Full (strict)** | Encrypted and certificate-checked all the way to Caddy |
| Always Use HTTPS | On | |
| Minimum TLS version | 1.2 | |
| Automatic HTTPS Rewrites | On | |
| HSTS | **Off for now** | Hard to undo; enabled at each site's launch (Task 5.9 / 9.5) |
| DNSSEC | On, if the registrar supports it | |

## 2. Rules for every record

- Every record pointing to the VPS is **Proxied** (orange cloud). A DNS-only record would publish the server's
  real IP and let visitors bypass Cloudflare.
- Never create a record such as `ssh.` or `server.` for the VPS: connect to SSH with the IP.
- Do not touch records this project does not own: `vlab.upwilling.fr` (out of scope), MX and email TXT records
  (SPF, DKIM, DMARC). The email task (Brevo, ADR-012) lists its own records.
- `A` = VPS IPv4. `AAAA` = VPS IPv6, only if the VPS has one.

## 3. Production zone `upwilling.fr`

| Name | Type | Content | Proxy | When |
|---|---|---|---|---|
| `admin` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Task 1.4 (Caddy running) |
| `hooks` | A / AAAA | VPS IP | Proxied (no Access: providers call it) | Task 1.4 |
| `stats` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Umami (Task 5.8) |
| `careerboost` | A / AAAA | VPS IP | Proxied | **Career Boost launch (Task 5.9)** |
| `@` (apex) | A / AAAA | VPS IP | Proxied | **Academy launch (Task 9.5)** |
| `www` | CNAME | `upwilling.fr` | Proxied | With the apex (Caddy redirects `www` to the apex) |
| `vlab` | — | unchanged | — | Never: out of scope |

The production stack runs on a non-public test hostname before each launch (01_ARCHITECTURE.md §16).
Its name is chosen in Task 1.5. Until then, do not add other records for the VPS.

## 4. Recette zone (separate domain, ADR-017; example `upwilling-recette.fr`)

Bought by the human (PO decision, 01_ARCHITECTURE.md §17). Never a `*.upwilling.fr` name: production session
cookies would reach it.

| Name | Type | Content | Proxy | When |
|---|---|---|---|---|
| `@` / `www` | A / AAAA, CNAME | VPS IP / apex | Proxied | Task 1.4 |
| `careerboost` | A / AAAA | VPS IP | Proxied | Task 1.4 |
| `admin` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Task 1.4 |
| `hooks` | A / AAAA | VPS IP | Proxied | Task 1.4 |
| `stats` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Task 5.8 |

Every recette host is protected (basic auth in Caddy or Cloudflare Access) and sends `X-Robots-Tag: noindex, nofollow`.

## 5. Report to the agent

Send: the zone settings applied (screenshot or list), the names of the records created (not the IP), and the
recette domain once bought. The agent adds the recette hosts to the app's allowlist in Task 1.4.
