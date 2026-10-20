# Runbook — Edge, recette and production stacks (Task 1.4) [HUMAN]

- Who: the supervisor (or another human admin). The agent and CI never log in to the server.
- When: once the server is provisioned (`server-setup.md` §3–§6, `verify.sh` passes). Recette first; the
  production stack is started by the deploy workflow of Task 1.5.
- Files: `infra/server/compose.edge.yaml`, `compose.base.yaml`, `compose.recette.yaml`, `compose.production.yaml`,
  `caddy/Caddyfile`, `.env.*.example`. Decisions: ADR-023 (TLS, origin lock), ADR-022 (recette hosts), ADR-005 (Postgres).
- Time: about 45 minutes the first time.

## How it fits together

| Project | Folder on the server | Containers | Published ports |
|---|---|---|---|
| `upwilling-edge` | `/srv/upwilling-edge` | `caddy` | **443 only** |
| `upwilling-recette` | `/srv/upwilling-recette` | `web-upwilling`, `web-careerboost`, `cms`, `worker`, `postgres` | none |
| `upwilling-prod` | `/srv/upwilling-prod` | same | none |

Cloudflare → Caddy (origin certificate, Cloudflare's client certificate checked) → the web/cms containers over the
internal networks `upwilling-edge-prod` / `upwilling-edge-recette`. The edge project creates those networks:
**start it first.** Each stack has its own database container and volume.

## 1. Certificates (on YOUR computer, once)

Three things, all for the `upwilling.fr` zone. Never commit them, never send them in a chat.

**a. Origin certificate** (what Caddy shows to Cloudflare). Cloudflare dashboard → `upwilling.fr` → SSL/TLS →
Origin Server → Create Certificate: "Generate private key and CSR with Cloudflare", key type RSA (2048),
hostnames `upwilling.fr` and `*.upwilling.fr`, validity 15 years. Save the certificate as `origin.pem` and the private
key as `origin.key` (the key is shown only once).

**b. Origin-pull CA and Cloudflare's client certificate** (Authenticated Origin Pulls, zone-level). These are the
commands from Cloudflare's documentation, with names filled in:

```bash
mkdir upwilling-origin-pull && cd upwilling-origin-pull
openssl genrsa -aes256 -out origin-pull-ca.key 4096
openssl req -x509 -new -key origin-pull-ca.key -sha256 -days 1826 -subj "/CN=upwilling.fr origin pull CA" -out origin-pull-ca.pem
openssl req -new -nodes -newkey rsa:4096 -subj "/CN=upwilling.fr" -keyout cloudflare-client.key -out cloudflare-client.csr
printf 'basicConstraints=CA:FALSE\nextendedKeyUsage=clientAuth\n' > client.v3.ext
openssl x509 -req -in cloudflare-client.csr -CA origin-pull-ca.pem -CAkey origin-pull-ca.key -CAcreateserial -days 730 -sha256 -extfile client.v3.ext -out cloudflare-client.pem
```

Then in Cloudflare: SSL/TLS → Origin Server → Authenticated Origin Pulls → **Zone-level** → Upload certificate:
paste `cloudflare-client.pem` and `cloudflare-client.key`. Then switch zone-level Authenticated Origin Pulls **On**.
(This does not disturb the current site: an origin that does not ask for a client certificate ignores it.)

- Only `origin-pull-ca.pem` goes to the server. `origin-pull-ca.key` (and its passphrase) go to the password
  manager, then delete the local copies of every file in this folder.

**c. Write the expiry dates** in the password manager entry: origin certificate (15 years), origin-pull CA (5 years),
Cloudflare client certificate (2 years). Cloudflare sends no reminder. Renewing = repeat the step, replace the files,
reload Caddy (§7).

## 2. Copy the files to the server

From a clone of the repository on your computer (replace `<admin>` and `<server-ip>`):

```bash
scp infra/server/compose.edge.yaml infra/server/compose.base.yaml infra/server/compose.recette.yaml \
    infra/server/compose.production.yaml infra/server/caddy/Caddyfile \
    origin.pem origin.key upwilling-origin-pull/origin-pull-ca.pem <admin>@<server-ip>:/tmp/
```

Then on the server, as `<admin>`:

```bash
sudo install -d -m 0750 -o deploy -g deploy /srv/upwilling-edge/caddy /srv/upwilling-edge/certs
sudo install -m 0644 -o deploy -g deploy /tmp/compose.edge.yaml /srv/upwilling-edge/
sudo install -m 0644 -o deploy -g deploy /tmp/Caddyfile /srv/upwilling-edge/caddy/
sudo install -m 0600 -o deploy -g deploy /tmp/origin.pem /tmp/origin.key /tmp/origin-pull-ca.pem /srv/upwilling-edge/certs/
sudo install -m 0644 -o deploy -g deploy /tmp/compose.base.yaml /tmp/compose.recette.yaml /srv/upwilling-recette/
sudo install -m 0644 -o deploy -g deploy /tmp/compose.base.yaml /tmp/compose.production.yaml /srv/upwilling-prod/
sudo rm /tmp/compose.*.yaml /tmp/Caddyfile /tmp/origin.pem /tmp/origin.key /tmp/origin-pull-ca.pem
```

## 3. The `.env` files

Each folder gets a `.env` from the matching template (`infra/server/.env.edge.example`, `.env.recette.example`,
`.env.production.example`), mode 600, owner `deploy`. Create them with `sudo -u deploy nano /srv/<folder>/.env`, then
`sudo chmod 600 /srv/<folder>/.env`.

- Edge: `CADDY_UID` / `CADDY_GID` = output of `id -u deploy` / `id -g deploy`. Recette basic auth: choose a user name
  and a long password (password manager), then get its hash with
  `sudo docker run --rm -it caddy:2.11.7-alpine caddy hash-password` and paste it **between single quotes**.
- Recette and production: `POSTGRES_PASSWORD` from `openssl rand -hex 32` (a different one per stack, both in the
  password manager). `APP_IMAGE`: see §4.

## 4. The image (until Task 1.5 publishes it)

Task 1.5 pushes an image per commit to GitHub's registry and sets `APP_IMAGE`. Until then, build it on the server
(the Arm VM builds a native arm64 image), as `deploy`:

```bash
sudo -iu deploy
git clone https://github.com/akramnemri/Upwilling.git ~/upwilling-src && cd ~/upwilling-src
git switch develop && sha=$(git rev-parse --short HEAD)
docker build -f apps/web/Dockerfile -t "upwilling-web:$sha" .
echo "APP_IMAGE=upwilling-web:$sha"   # put this line in /srv/upwilling-recette/.env
```

## 5. Start

As `deploy` (`sudo -iu deploy`):

```bash
cd /srv/upwilling-edge && docker compose -f compose.edge.yaml up -d --wait
cd /srv/upwilling-recette && docker compose -f compose.recette.yaml up -d --wait
docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Every container should say `healthy`. Only `upwilling-edge-caddy-1` shows a published port (`0.0.0.0:443->8443/tcp`).
Then run `sudo /path/to/verify.sh` again: it must not report any other public port.

## 6. DNS and checks

1. Create the recette records of `cloudflare-dns.md` §4 (Proxied).
2. Open `https://recette.upwilling.fr` and `https://recette-careerboost.upwilling.fr`: the browser asks for the basic
   auth user and password, then shows each brand's page. `https://recette-admin.upwilling.fr` asks too.
3. `https://recette-hooks.upwilling.fr/` answers 404 without asking for a password (webhook paths only).
4. Headers: check `https://recette.upwilling.fr` with a headers checker (for example securityheaders.com; it sees
   the 401 page, which carries the same headers). Expected: `X-Content-Type-Options`, `X-Frame-Options`,
   `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noindex, nofollow`, no `Server`. No HSTS yet (ADR-023).
5. Origin lock: from your computer,
   `curl -sk --resolve recette.upwilling.fr:443:<server-ip> https://recette.upwilling.fr/ -o /dev/null -w '%{http_code}\n'`
   must fail the handshake (prints `000`): without Cloudflare's client certificate nothing gets in.

## 7. Everyday operations (as `deploy`, in the project's folder)

| Task | Command |
|---|---|
| Status | `docker compose -f compose.<name>.yaml ps` |
| Logs | `docker compose -f compose.<name>.yaml logs --tail 100 <service>` |
| Reload Caddy after a Caddyfile or certificate change | `docker compose -f compose.edge.yaml exec caddy caddy reload --config /etc/caddy/Caddyfile` |
| Restart one service | `docker compose -f compose.<name>.yaml restart <service>` |
| Stop a stack (data kept) | `docker compose -f compose.<name>.yaml down` |

- **Never** `down -v` / `--volumes` on recette or production: it deletes that stack's database volume.
- Stop recette or production before the edge project; start the edge project first.
- Memory: limits are in the compose files (production per 01_ARCHITECTURE.md §5.1, recette about 60 %).
  `docker stats --no-stream` shows real use; tune after measuring (Task 1.7).

## 8. Report to the agent

Send: the output of `docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'`, the results of §6 (status codes
and the headers list, no IP), and anything that differed from this runbook.

## For developers: testing without a server

`bash infra/server/test/smoke-stacks.sh` (needs Docker, curl, openssl and the image `upwilling-web:local`) starts the
three projects locally under test names, with throwaway certificates, and checks routing, basic auth, the origin
lock, headers, isolation and container hardening; then removes everything. CI runs it in the `docker` job.
It refuses to run on a machine where the real projects exist.
