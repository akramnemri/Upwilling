# Runbook — Provision the VPS (Task 1.3) [HUMAN]

- Who: the supervisor (or another human admin). The agent and CI never run these scripts and never log in to the server.
- When: once, on a fresh VPS. Safe to re-run later (the scripts are idempotent) after a script update.
- Files: `infra/server/scripts/provision.sh`, `verify.sh`, `lib.sh`. Decisions: ADR-020. Architecture: ADR-003, ADR-017.
- Result: a hardened Ubuntu server with Docker, ready for the compose projects of Task 1.4.
- Time: about 30 minutes.

## 1. What to buy and choose (human)

**Test phase (now, ADR-021): no purchase.** Create the free Oracle Cloud VM in §11 first, then continue at §2.
The table below is for the paid VPS, before the sites accept real traffic.

| Item | Choice |
|---|---|
| VPS | 8 GB RAM minimum (01_ARCHITECTURE.md §5.1), 4 vCPU, 80 GB+ SSD, IPv4 (+ IPv6 if offered) |
| Location | EU data centre (France or Germany): personal data stays in the EU (RGPD) |
| Image | **Ubuntu Server 26.04 LTS** (24.04 LTS also supported). No control panel, no preinstalled Docker. |
| Provider options | Web console / rescue mode access (your way back in if SSH breaks). Snapshots if offered. |

Note the server's public IP. It is not secret, but do not commit it: the repository is public.

## 2. Create two SSH keys on YOUR computer (never on the server)

```bash
ssh-keygen -t ed25519 -C "upwilling-admin" -f ~/.ssh/upwilling_admin
ssh-keygen -t ed25519 -C "upwilling-deploy" -f ~/.ssh/upwilling_deploy -N ""
```

- `upwilling_admin` is yours: protect it with a passphrase.
- `upwilling_deploy` is for GitHub Actions (Task 1.5): no passphrase. Its private key will only be stored as a
  GitHub environment secret. Never commit it, never send it in a chat.
- Only the `.pub` files go to the server.

## 3. Copy the public keys and the scripts to the server

Log in with the access the provider gives (often `root` with a password, or `ubuntu` with a key; on Oracle Cloud:
`ubuntu` with the admin key, then use `sudo` for the commands below and `/tmp` instead of `/root` for the copies):

```bash
scp ~/.ssh/upwilling_admin.pub ~/.ssh/upwilling_deploy.pub root@<server-ip>:/root/
ssh root@<server-ip>
```

On the server, get the scripts from the public repository at the commit you reviewed:

```bash
apt-get update && apt-get install -y git
git clone https://github.com/akramnemri/Upwilling.git /root/upwilling
cd /root/upwilling && git checkout <commit-sha>
```

## 4. Run the provisioning

Pick your admin login name (lowercase, for example your first name). Below it is `<admin>`.

1. Dry run, changes nothing, shows every change:

   ```bash
   bash infra/server/scripts/provision.sh --admin-user <admin> \
     --admin-key /root/upwilling_admin.pub --deploy-key /root/upwilling_deploy.pub --dry-run
   ```

2. Create the users first, then give the admin a password (sudo asks for it):

   ```bash
   bash infra/server/scripts/provision.sh --admin-user <admin> \
     --admin-key /root/upwilling_admin.pub --deploy-key /root/upwilling_deploy.pub \
     --only packages,time,journald,swap,users
   passwd <admin>
   ```

   Store this password in your password manager.

3. Run everything. Steps already done print `unchanged`. The `ssh` step runs last: it disables root and password
   logins, and refuses to run if the admin has no key or no password (so you cannot lock yourself out).

   ```bash
   bash infra/server/scripts/provision.sh --admin-user <admin> \
     --admin-key /root/upwilling_admin.pub --deploy-key /root/upwilling_deploy.pub
   ```

## 5. Test the logins BEFORE closing the root session

Keep the root session open. In a **new** terminal on your computer:

```bash
ssh -i ~/.ssh/upwilling_admin <admin>@<server-ip>
```

Then on the server, check sudo works: `sudo -v` (it asks for the admin password).

```bash
ssh -i ~/.ssh/upwilling_deploy deploy@<server-ip> docker ps
ssh root@<server-ip>
```

Expected: the deploy command prints an empty container list; the root login is refused (`Permission denied (publickey)`).
Only when all three behave like this, close the root session.

## 6. Verify and report

As `<admin>` on the server (the root copy is not readable by `<admin>`):

```bash
git clone https://github.com/akramnemri/Upwilling.git ~/upwilling && cd ~/upwilling && git checkout <commit-sha>
sudo bash infra/server/scripts/verify.sh --admin-user <admin>
sudo docker run --rm hello-world && sudo docker image rm hello-world
```

Send the agent the `verify.sh` output (it contains versions, no secrets) and confirm:
SSH as `<admin>` and `deploy` works, root login is refused, `hello-world` printed its message.
Then delete the copied keys and clone from root's home: `sudo rm -rf /root/upwilling /root/*.pub`.

If the provider offers snapshots, take one now ("baseline after Task 1.3").

## 7. What the scripts changed (for review or manual rollback)

| Area | Files / commands |
|---|---|
| Users | `<admin>` (sudo, password + key), `deploy` (docker group, key only, no sudo) |
| SSH | `/etc/ssh/sshd_config.d/10-upwilling.conf` |
| Firewall | `ufw`: deny incoming, allow 22, 80, 443. On Oracle Cloud: no ufw; ACCEPT 80/443 added to `/etc/iptables/rules.v4` (§11) |
| fail2ban | `/etc/fail2ban/jail.d/50-upwilling.local` (sshd jail, 5 failures in 10 min → 1 h ban) |
| Updates | `/etc/apt/apt.conf.d/20auto-upgrades`, `52upwilling-unattended-upgrades` (security only, no auto reboot) |
| Docker | `/etc/apt/keyrings/docker.asc`, `/etc/apt/sources.list.d/docker.sources`, `/etc/docker/daemon.json` |
| Logs | `/etc/systemd/journald.conf.d/50-upwilling.conf` (500 MB, 1 month); container logs 3 × 10 MB |
| Swap | `/swapfile` (2 GB unless a swap already existed), `/etc/fstab`, `/etc/sysctl.d/60-upwilling-swap.conf` |
| Time | time zone UTC, NTP on |
| Layout | `/srv/upwilling-edge` (Caddy), `/srv/upwilling-prod`, `/srv/upwilling-recette` (owner `deploy`, mode 750) |

## 8. Routine maintenance (monthly, or when an alert says so)

- `sudo apt update && sudo apt upgrade` installs non-security updates, including Docker. Then check the sites.
- If `/var/run/reboot-required` exists (`verify.sh` warns), reboot in a quiet hour: `sudo reboot`.
  Containers come back by themselves (`restart: unless-stopped`, Task 1.4).
- `sudo fail2ban-client status sshd`, `df -h`, `sudo docker system df`.
- Re-run `verify.sh` after any manual change.
- Compare Cloudflare's IP ranges (https://www.cloudflare.com/ips/) with `trusted_proxies` in `infra/server/caddy/Caddyfile`;
  if they changed, update the file through a PR. Check the origin certificate's expiry date (`docs/runbooks/compose-stacks.md`).

## 9. Important rules

- **Docker bypasses ufw for published ports.** Only Caddy may publish a port (443, Task 1.4, ADR-023). Never add `ports:` to
  Postgres, Umami or app containers: they talk over internal Docker networks. `verify.sh` fails on any other public port.
- The `docker` group is equivalent to root. That is why the deploy key gets restricted in Task 1.5
  (`restrict` options in `authorized_keys`) and its private part lives only in GitHub secrets.
- `.env` files for the compose projects are created by the human (Task 1.4, `docs/runbooks/compose-stacks.md`), mode 600, owner `deploy`.

## 10. If you are locked out

Use the provider's web console or rescue mode, log in as `<admin>` with the password, then either fix the key in
`~/.ssh/authorized_keys` or temporarily move `/etc/ssh/sshd_config.d/10-upwilling.conf` away and
`sudo systemctl restart ssh`. If the firewall is the problem: `sudo ufw disable` (on Oracle Cloud: check the VCN security list and
`/etc/iptables/rules.v4`, restore `rules.v4.before-upwilling` if needed, then reboot). Re-run `provision.sh` afterwards.

## 11. Oracle Cloud Always Free (test phase, ADR-021) [HUMAN]

1. **Account.** Sign up at https://cloud.oracle.com (card verification). The **home region is permanent**: choose an
   EU one (France Central – Paris, France South – Marseille or Germany Central – Frankfurt).
   Recommended: upgrade the tenancy to **Pay As You Go** and set a budget alert at €1. It stays €0 inside the free
   allowance and is reported to stop the reclamation of idle free VMs (ADR-021). Check Oracle's current terms when you do it.
2. **Network.** Networking → Virtual cloud networks → "Start VCN Wizard" → "Create VCN with Internet Connectivity".
   In the public subnet's **security list**, keep only these ingress rules (TCP, source `0.0.0.0/0`, or your own IP for 22):
   22, 80, 443. This list is the outer firewall, and the only one in front of ports Docker publishes.
3. **VM.** Compute → Instances → Create:
   - Image: **Canonical Ubuntu 26.04** (or 24.04), aarch64.
   - Shape: **VM.Standard.A1.Flex**, 2 OCPU, 12 GB memory (the whole free allowance).
   - Networking: the public subnet above, with a public IPv4 address.
   - SSH keys: paste `~/.ssh/upwilling_admin.pub` (it is installed for the `ubuntu` user).
   - Boot volume: 100 GB (the free total is 200 GB; keep room for backups).
   - "Out of capacity": retry later or pick another availability domain. Never change the home region.
4. **Provision.** Continue with §3–§6, logging in as `ubuntu` and using `sudo`. `provision.sh` detects Oracle's image
   (its `InstanceServices` firewall rules): it keeps Oracle's iptables rules, opens 80/443 in `/etc/iptables/rules.v4`
   (backup: `rules.v4.before-upwilling`) and **never enables ufw**. Oracle documents that ufw can stop the instance
   from booting. After the `ssh` step, only `<admin>` and `deploy` can log in; `ubuntu` cannot (expected).
5. **Never** run `ufw enable`, `iptables -F` or `iptables-restore` by hand on this VM: the first two can remove
   Oracle's essential rules, and a manual restore also wipes Docker's rules until Docker restarts.

## For developers: testing the scripts without a server

```bash
bash infra/server/test/test-in-container.sh              # Ubuntu 26.04
bash infra/server/test/test-in-container.sh 24.04
bash infra/server/test/test-in-container.sh 26.04 --oci  # Oracle Cloud image (fixture: infra/server/test/oci-rules.v4)
```

It runs the scripts for real in a throwaway privileged container with systemd. Swap and time are skipped because
they would change the Docker host. It checks a second run changes nothing, then runs `verify.sh` and tries the SSH logins.
Remove the test images afterwards: `docker image rm upwilling-provision-test:26.04 upwilling-provision-test:24.04`.
