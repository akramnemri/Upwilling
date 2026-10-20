# Runbook — Cloudflare DNS and TLS settings (Task 1.3) [HUMAN]

- Who: the supervisor, in the Cloudflare dashboard. The agent never has Cloudflare credentials.
- When: zone settings now; each record at the task named in its "When" column. Changing a record too early
  can take a live page offline (`upwilling.fr` still serves the current WordPress page).
- Architecture: 01_ARCHITECTURE.md §5.2 (hosts), ADR-003, ADR-017, ADR-022. TLS between Cloudflare and Caddy: ADR-023
  (origin certificate + Authenticated Origin Pulls, set up in `compose-stacks.md` §1).

## 1. Zone settings (both zones: `upwilling.fr` and the recette domain)

| Setting | Value | Why |
|---|---|---|
| SSL/TLS encryption mode | **Full (strict)** | Encrypted and certificate-checked all the way to Caddy |
| Always Use HTTPS | On | |
| Minimum TLS version | 1.2 | |
| Automatic HTTPS Rewrites | On | |
| HSTS | **Off for now** | Hard to undo; enabled at each site's launch (Task 5.9 / 9.5) |
| DNSSEC | On, if the registrar supports it | |
| Authenticated Origin Pulls (zone-level) | On, after uploading our client certificate (`compose-stacks.md` §1) | The server only accepts connections from Cloudflare (ADR-023) |

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
| `admin` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Task 1.5 (production stack running) |
| `hooks` | A / AAAA | VPS IP | Proxied (no Access: providers call it) | Task 1.5 |
| `stats` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Umami (Task 5.8) |
| `careerboost` | A / AAAA | VPS IP | Proxied | **Career Boost launch (Task 5.9)** |
| `@` (apex) | A / AAAA | VPS IP | Proxied | **Academy launch (Task 9.5)** |
| `www` | CNAME | `upwilling.fr` | Proxied | With the apex (Caddy redirects `www` to the apex) |
| `vlab` | — | unchanged | — | Never: out of scope |

The production stack runs on a non-public test hostname before each launch (01_ARCHITECTURE.md §16).
Its name is chosen in Task 1.5. Until then, do not add other records for the VPS.

## 4. Recette during the test phase (ADR-022): hosts in the `upwilling.fr` zone

Free while we test. First-level names only: Cloudflare's free certificate does not cover `a.b.upwilling.fr`.

| Name | Type | Content | Proxy | When |
|---|---|---|---|---|
| `recette` | A / AAAA | server IP | Proxied | Task 1.4 |
| `recette-careerboost` | A / AAAA | server IP | Proxied | Task 1.4 |
| `recette-admin` | A / AAAA | server IP | Proxied (+ Cloudflare Access when set up; basic auth meanwhile) | Task 1.4 |
| `recette-hooks` | A / AAAA | server IP | Proxied | Task 1.4 |
| `recette-stats` | A / AAAA | server IP | Proxied + Cloudflare Access | Task 5.8 |

Before accepting traffic: buy the recette domain, create §5's records, then delete these `recette*` records.

## 5. Recette zone after the test phase (separate domain, ADR-017; example `upwilling-recette.fr`)

Bought by the human (PO decision, 01_ARCHITECTURE.md §17). Never a `*.upwilling.fr` name: production session
cookies would reach it.

| Name | Type | Content | Proxy | When |
|---|---|---|---|---|
| `@` / `www` | A / AAAA, CNAME | VPS IP / apex | Proxied | Before accepting traffic |
| `careerboost` | A / AAAA | VPS IP | Proxied | Before accepting traffic |
| `admin` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Before accepting traffic |
| `hooks` | A / AAAA | VPS IP | Proxied | Before accepting traffic |
| `stats` | A / AAAA | VPS IP | Proxied + Cloudflare Access | Task 5.8 |

Every recette host is protected (basic auth in Caddy or Cloudflare Access) and sends `X-Robots-Tag: noindex, nofollow`.

## 6. Report to the agent

Send: the zone settings applied (screenshot or list), the names of the records created (not the IP), and the
recette domain once bought. The test-phase recette hosts (§4) are already in the app's allowlist (Task 1.4); the
recette domain's hosts are added when it is bought (ADR-022 hard switch).
