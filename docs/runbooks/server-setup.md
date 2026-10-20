# Runbook — Provision the VPS (Task 1.3) [HUMAN]

- Who: the supervisor (or another human admin). The agent and CI never run these scripts and never log in to the server.
- When: once, on a fresh VPS. Safe to re-run later (the scripts are idempotent) after a script update.
- Files: `infra/server/scripts/provision.sh`, `verify.sh`, `lib.sh`. Decisions: ADR-020. Architecture: ADR-003, ADR-017.
- Result: a hardened Ubuntu server with Docker, ready for the compose projects of Task 1.4.
- Time: about 30 minutes.

## 1. What to buy and choose (human)

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

Log in with the access the provider gives (often `root` with a password, or `ubuntu` with a key):

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
| Firewall | `ufw`: deny incoming, allow 22, 80, 443 |
| fail2ban | `/etc/fail2ban/jail.d/50-upwilling.local` (sshd jail, 5 failures in 10 min → 1 h ban) |
| Updates | `/etc/apt/apt.conf.d/20auto-upgrades`, `52upwilling-unattended-upgrades` (security only, no auto reboot) |
| Docker | `/etc/apt/keyrings/docker.asc`, `/etc/apt/sources.list.d/docker.sources`, `/etc/docker/daemon.json` |
| Logs | `/etc/systemd/journald.conf.d/50-upwilling.conf` (500 MB, 1 month); container logs 3 × 10 MB |
| Swap | `/swapfile` (2 GB unless a swap already existed), `/etc/fstab`, `/etc/sysctl.d/60-upwilling-swap.conf` |
| Time | time zone UTC, NTP on |
| Layout | `/srv/upwilling-prod`, `/srv/upwilling-recette` (owner `deploy`, mode 750) |

## 8. Routine maintenance (monthly, or when an alert says so)

- `sudo apt update && sudo apt upgrade` installs non-security updates, including Docker. Then check the sites.
- If `/var/run/reboot-required` exists (`verify.sh` warns), reboot in a quiet hour: `sudo reboot`.
  Containers come back by themselves (`restart: unless-stopped`, Task 1.4).
- `sudo fail2ban-client status sshd`, `df -h`, `sudo docker system df`.
- Re-run `verify.sh` after any manual change.

## 9. Important rules

- **Docker bypasses ufw for published ports.** Only Caddy may publish ports (80/443, Task 1.4). Never add `ports:` to
  Postgres, Umami or app containers: they talk over internal Docker networks. `verify.sh` fails on any other public port.
- The `docker` group is equivalent to root. That is why the deploy key gets restricted in Task 1.5
  (`restrict` options in `authorized_keys`) and its private part lives only in GitHub secrets.
- `.env` files for the compose projects are created by the human in Task 1.4, mode 600, owner `deploy`.

## 10. If you are locked out

Use the provider's web console or rescue mode, log in as `<admin>` with the password, then either fix the key in
`~/.ssh/authorized_keys` or temporarily move `/etc/ssh/sshd_config.d/10-upwilling.conf` away and
`sudo systemctl restart ssh`. If the firewall is the problem: `sudo ufw disable`. Re-run `provision.sh` afterwards.

## For developers: testing the scripts without a server

```bash
bash infra/server/test/test-in-container.sh        # Ubuntu 26.04
bash infra/server/test/test-in-container.sh 24.04
```

It runs the scripts for real in a throwaway privileged container with systemd. Swap and time are skipped because
they would change the Docker host. It checks a second run changes nothing, then runs `verify.sh` and tries the SSH logins.
Remove the test images afterwards: `docker image rm upwilling-provision-test:26.04 upwilling-provision-test:24.04`.
