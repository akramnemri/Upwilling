# ADR-020 — Server baseline: OS, access and hardening of the VPS

- Status: Proposed (supervisor asked for standard practice, 2026-10-20; confirm or amend)
- Date: 2026-10-20
- Source: Task 1.3 (`docs/ai/05_ROADMAP.md`), ADR-003, ADR-017. Verified on 2026-10-20: Docker's install page
  (supported: Ubuntu 26.04, 24.04, 22.04 LTS), Ubuntu LTS list (26.04.1 LTS released, 24.04.5 LTS supported).

## Context

ADR-003 puts both sites, recette and production, on one VPS that we harden and maintain ourselves.
The human runs the provisioning; the agent writes it. It must be repeatable, reviewable and hard to get wrong.

## Decision

| Topic | Decision | Main reason |
|---|---|---|
| OS | **Ubuntu Server 26.04 LTS** (24.04 LTS accepted); scripts refuse anything else | LTS with 5 years of security updates; officially supported by Docker; most common VPS image |
| Scripts | Bash, `set -euo pipefail`, idempotent, `--dry-run`, steps selectable with `--only`; a read-only `verify.sh` | Re-runnable after changes; the human sees every change before it happens |
| Users | `<admin>` (human: SSH key + password for sudo) and `deploy` (CI: SSH key only, docker group, no sudo) | Root login disabled; every action is traceable to a named user |
| SSH | Keys only (`AuthenticationMethods publickey`), no root, `AllowUsers <admin> deploy`, no forwarding, port 22 | Removes password guessing entirely; port 22 per roadmap (a different port only hides it) |
| Lockout guards | The SSH step refuses to run without an admin key and password; `sshd -t` before reload, rollback if invalid | A typo must not lock the human out |
| Firewall | `ufw`: deny incoming; allow 22, 80, 443. **Oracle Cloud images: no ufw**, Oracle's iptables rules + 80/443 (ADR-021) | Simple and standard on Ubuntu; Oracle documents that ufw breaks its images |
| Docker vs ufw | Ports published by Docker bypass ufw: **only Caddy publishes ports**; `verify.sh` fails on any other public port | Documented Docker behaviour; checked rather than worked around |
| Brute force | fail2ban, sshd jail, systemd backend, 5 failures / 10 min → 1 h ban | Roadmap item; mostly cuts log noise since passwords are off |
| Updates | `unattended-upgrades` for the Ubuntu security pocket only, daily; **no automatic reboot**; other upgrades (Docker included) by hand, monthly | Security fixes without surprise restarts of the stack |
| Docker | Engine + Compose plugin from Docker's apt repository (key fingerprint `9DC8 5822 9FC7 DD38 854A E2D8 8D81 803C 0EBF CD88` checked); `daemon.json`: json-file logs 3 × 10 MB, `live-restore`, `no-new-privileges` | Official, current packages; safe defaults for every container, including hand-started ones |
| Version pinning | Docker and OS packages are **not** pinned: they come from the vendor repositories, and `verify.sh` prints the installed versions for the task report | Security fixes must flow; the image itself is pinned (ADR-018) |
| Memory | 2 GB swap file (unless swap exists), `vm.swappiness = 10` | A memory spike slows the server down instead of killing a container |
| Time and logs | UTC, NTP on (chrony installed only if no NTP client exists); journal capped at 500 MB / 1 month | Consistent timestamps across logs; disk cannot fill with logs |
| Layout | `/srv/upwilling-prod`, `/srv/upwilling-recette`, owner `deploy`, mode 750 | One directory per compose project (ADR-017) |
| Testing | `infra/server/test/test-in-container.sh`: real run in a privileged systemd container (Ubuntu 26.04 and 24.04), second-run idempotency, `verify.sh`, SSH login checks; shellcheck in CI | Scripts are tested before a human runs them on the real server |

Test images: `ubuntu:26.04@sha256:c098726dd9b9733f3e885f8de0ef375206a311b0a317eadc40d347b1115fb944`,
`ubuntu:24.04@sha256:68ee22004a9109b44973313b02ff7b1de250f1de0f5ecb628d73f579aaff33ac` (test harness only).

## Alternatives not chosen

- Debian 13: equally valid; Ubuntu chosen because more VPS providers offer it and Docker documents it first.
- Ansible: more powerful, but one more tool to learn for a single server; Bash is readable by the whole team.
- Non-standard SSH port, port knocking: little real security gain once passwords are off.
- Restricting 80/443 to Cloudflare IP ranges: needs `DOCKER-USER` iptables rules kept in sync with Cloudflare's
  list; reconsider with the TLS decision of Task 1.4 (for example Authenticated Origin Pulls).
- Automatic reboots: would restart production at an arbitrary time; a human reboots in a quiet hour instead.

## Consequences

- The deploy user is root-equivalent through the docker group: Task 1.5 must restrict its key (`restrict`,
  `from=` GitHub ranges or a forced command) and keep the private key only in GitHub environment secrets.
- A human must do a monthly maintenance pass (runbook §8) and react to `reboot-required`.
- The server's sudo password lives in the supervisor's password manager.

## Revisit when

- Ubuntu 28.04 LTS is out, or 24.04 leaves standard support (2029).
- A second server, or a second human admin, joins (then: configuration management, per-person admin users).
- The Task 1.4 TLS choice makes origin restriction to Cloudflare cheap.
