#!/usr/bin/env bash
# Provisions the UpWilling VPS (Task 1.3): deploy and admin users with SSH keys only, firewall (22/80/443),
# automatic security updates, fail2ban, Docker Engine + Compose plugin, /srv layout, swap, UTC, log limits.
#
# Run by the HUMAN on the server, as root (never by CI or the agent). Idempotent: running it again changes
# nothing that is already in place. Read docs/runbooks/server-setup.md first. Decisions: ADR-020.
#
# Usage:
#   sudo bash provision.sh --admin-user <name> --admin-key <file.pub> --deploy-key <file.pub> [options]
#
# Options:
#   --dry-run            print what would change, change nothing
#   --only <a,b,...>     run only these steps (in the normal order); default: all
#   --swap-size <size>   swap file size if no swap exists (default 2G)
#   --help
#
# Steps, in order: packages time journald swap users docker layout updates fail2ban firewall ssh
# `ssh` (disables root and password logins) runs last and refuses to run while it could lock you out.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=SCRIPTDIR/lib.sh
. "$SCRIPT_DIR/lib.sh"

readonly ALL_STEPS=(packages time journald swap users docker layout updates fail2ban firewall ssh)
readonly DEPLOY_USER="deploy"
readonly APP_DIRS=("/srv/upwilling-prod" "/srv/upwilling-recette")
# Docker's apt signing key (https://download.docker.com/linux/ubuntu/gpg), checked before it is trusted.
readonly DOCKER_KEY_FINGERPRINT="9DC858229FC7DD38854AE2D88D81803C0EBFCD88"

# apt must never stop on a question (needrestart asks which services to restart on Ubuntu).
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a

ADMIN_USER=""
ADMIN_KEY=""
DEPLOY_KEY=""
SWAP_SIZE="2G"
ONLY=""

usage() { sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'; }

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --admin-user) ADMIN_USER=${2:-}; shift 2 ;;
      --admin-key) ADMIN_KEY=${2:-}; shift 2 ;;
      --deploy-key) DEPLOY_KEY=${2:-}; shift 2 ;;
      --swap-size) SWAP_SIZE=${2:-}; shift 2 ;;
      --only) ONLY=${2:-}; shift 2 ;;
      --dry-run) DRY_RUN=true; shift ;;
      --help | -h) usage; exit 0 ;;
      *) die "unknown option: $1 (see --help)" ;;
    esac
  done
}

selected_steps() {
  if [[ -z $ONLY ]]; then
    printf '%s\n' "${ALL_STEPS[@]}"
    return
  fi
  local requested step
  IFS=',' read -ra requested <<<"$ONLY"
  for step in "${requested[@]}"; do
    [[ " ${ALL_STEPS[*]} " == *" $step "* ]] || die "unknown step '$step' (steps: ${ALL_STEPS[*]})"
  done
  for step in "${ALL_STEPS[@]}"; do
    if [[ ",$ONLY," == *",$step,"* ]]; then
      printf '%s\n' "$step"
    fi
  done
}

validate_args() {
  local steps=$1
  if [[ $steps == *users* || $steps == *ssh* ]]; then
    [[ $ADMIN_USER =~ ^[a-z][a-z0-9-]{1,31}$ ]] ||
      die "--admin-user must be a lowercase login name (letters, digits, '-'), got '${ADMIN_USER}'"
    [[ $ADMIN_USER != "root" && $ADMIN_USER != "$DEPLOY_USER" ]] ||
      die "--admin-user must not be 'root' or '$DEPLOY_USER'"
  fi
  if [[ $steps == *users* ]]; then
    [[ -n $ADMIN_KEY && -n $DEPLOY_KEY ]] || die "--admin-key and --deploy-key are required"
    validate_public_key_file "$ADMIN_KEY"
    validate_public_key_file "$DEPLOY_KEY"
    [[ "$(cat "$ADMIN_KEY")" != "$(cat "$DEPLOY_KEY")" ]] ||
      die "the admin and deploy keys must be different keys (the deploy key ends up in GitHub secrets)"
  fi
  [[ $SWAP_SIZE =~ ^[1-9][0-9]*[MG]$ ]] || die "--swap-size must look like 2G or 512M"
}

# --- steps ---------------------------------------------------------------------------------------------

step_packages() {
  log "Packages: update the system and install the base tools"
  run apt-get update
  run apt-get -y upgrade
  run apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg openssh-server ufw fail2ban python3-systemd \
    unattended-upgrades apt-listchanges
}

step_time() {
  log "Time: UTC time zone, clock synchronized over NTP"
  if [[ "$(timedatectl show -p Timezone --value)" == "UTC" ]]; then
    info "time zone already UTC"
  else
    run timedatectl set-timezone UTC
  fi
  # VPS images ship an NTP client (chrony or systemd-timesyncd); install chrony only when there is none.
  if [[ "$(timedatectl show -p CanNTP --value)" != "yes" ]]; then
    run apt-get install -y --no-install-recommends chrony
  fi
  run timedatectl set-ntp true
}

step_journald() {
  log "Logs: cap the systemd journal (Docker container logs are capped in daemon.json)"
  if write_file /etc/systemd/journald.conf.d/50-upwilling.conf 0644 root:root <<'EOF'; then
# Managed by infra/server/scripts/provision.sh (ADR-020).
[Journal]
SystemMaxUse=500M
MaxRetentionSec=1month
EOF
    run systemctl restart systemd-journald
  fi
}

step_swap() {
  log "Swap: a swap file so a memory spike slows the server down instead of killing containers"
  if [[ -n "$(swapon --show=NAME --noheadings)" ]]; then
    info "swap already active: $(swapon --show=NAME,SIZE --noheadings | tr -s ' ' | paste -sd ',')"
  else
    run fallocate -l "$SWAP_SIZE" /swapfile
    run chmod 600 /swapfile
    run mkswap /swapfile
    run swapon /swapfile
  fi
  if [[ -f /swapfile ]] && ! grep -q '^/swapfile ' /etc/fstab; then
    if [[ $DRY_RUN == true ]]; then
      info "[dry-run] append '/swapfile none swap sw 0 0' to /etc/fstab"
    else
      echo '/swapfile none swap sw 0 0' >>/etc/fstab
      info "added /swapfile to /etc/fstab"
    fi
  fi
  if write_file /etc/sysctl.d/60-upwilling-swap.conf 0644 root:root <<'EOF'; then
# Managed by infra/server/scripts/provision.sh (ADR-020): use swap only under real memory pressure.
vm.swappiness = 10
EOF
    run sysctl -p /etc/sysctl.d/60-upwilling-swap.conf
  fi
}

# ensure_user <name> — creates a login with no usable password ("*": SSH keys only, not a locked account).
ensure_user() {
  local name=$1
  if id "$name" >/dev/null 2>&1; then
    info "user $name exists"
  else
    run useradd --create-home --shell /bin/bash --user-group "$name"
    run usermod --password '*' "$name"
  fi
}

# add_authorized_key <user> <public key file> — appends the key if it is not there yet (other keys are kept).
add_authorized_key() {
  local user=$1 key_file=$2 home ssh_dir key
  key=$(grep -v '^[[:space:]]*$' "$key_file")
  if [[ $DRY_RUN == true ]] && ! id "$user" >/dev/null 2>&1; then
    info "[dry-run] install $(ssh-keygen -l -f "$key_file" | cut -d' ' -f2) for $user"
    return
  fi
  home=$(getent passwd "$user" | cut -d: -f6)
  ssh_dir="$home/.ssh"
  run install -d -m 0700 -o "$user" -g "$user" "$ssh_dir"
  if [[ -f $ssh_dir/authorized_keys ]] && grep -qxF "$key" "$ssh_dir/authorized_keys"; then
    info "key already authorized for $user"
  elif [[ $DRY_RUN == true ]]; then
    info "[dry-run] authorize $(ssh-keygen -l -f "$key_file" | cut -d' ' -f2) for $user"
  else
    printf '%s\n' "$key" >>"$ssh_dir/authorized_keys"
    info "authorized $(ssh-keygen -l -f "$key_file" | cut -d' ' -f2) for $user"
  fi
  run chown "$user:$user" "$ssh_dir/authorized_keys"
  run chmod 0600 "$ssh_dir/authorized_keys"
}

step_users() {
  log "Users: '$ADMIN_USER' (human, sudo with password) and '$DEPLOY_USER' (CI deployments, no sudo)"
  ensure_user "$ADMIN_USER"
  if id -nG "$ADMIN_USER" 2>/dev/null | grep -qw sudo; then
    info "$ADMIN_USER is in the sudo group"
  else
    run usermod -aG sudo "$ADMIN_USER"
  fi
  add_authorized_key "$ADMIN_USER" "$ADMIN_KEY"

  ensure_user "$DEPLOY_USER"
  add_authorized_key "$DEPLOY_USER" "$DEPLOY_KEY"

  if [[ "$(passwd -S "$ADMIN_USER" 2>/dev/null | awk '{print $2}')" != "P" ]]; then
    warn "$ADMIN_USER has no password yet: sudo needs one. Set it now with:  passwd $ADMIN_USER"
  fi
}

step_docker() {
  log "Docker: Engine and Compose plugin from Docker's official apt repository"
  if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
    run install -m 0755 -d /etc/apt/keyrings
    run curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    run chmod a+r /etc/apt/keyrings/docker.asc
  fi
  if [[ -f /etc/apt/keyrings/docker.asc ]]; then
    gpg --show-keys --with-colons /etc/apt/keyrings/docker.asc 2>/dev/null | grep -q "^fpr:*:${DOCKER_KEY_FINGERPRINT}:" ||
      die "/etc/apt/keyrings/docker.asc is not Docker's key ${DOCKER_KEY_FINGERPRINT}: delete it and investigate"
    info "Docker apt key fingerprint verified"
  fi

  local codename arch
  # shellcheck source=/dev/null
  codename=$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
  arch=$(dpkg --print-architecture)
  write_file /etc/apt/sources.list.d/docker.sources 0644 root:root <<EOF || true
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${codename}
Components: stable
Architectures: ${arch}
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  run apt-get update
  run apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # Defaults for every container, including ones started by hand: capped logs, no privilege escalation,
  # and containers keep running while the Docker daemon itself is restarted (upgrades).
  if write_file /etc/docker/daemon.json 0644 root:root <<'EOF'; then
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true,
  "no-new-privileges": true
}
EOF
    if systemctl is-active --quiet docker; then
      run systemctl restart docker
    fi
  fi
  run systemctl enable --now docker

  if id -nG "$DEPLOY_USER" 2>/dev/null | grep -qw docker; then
    info "$DEPLOY_USER is in the docker group"
  else
    # The docker group is root-equivalent: the deploy key gets restricted in Task 1.5 (runbook §6).
    run usermod -aG docker "$DEPLOY_USER"
  fi
}

step_layout() {
  log "Layout: one directory per compose project, owned by $DEPLOY_USER"
  local dir
  for dir in "${APP_DIRS[@]}"; do
    if [[ -d $dir ]] && [[ "$(stat -c '%a %U:%G' "$dir")" == "750 $DEPLOY_USER:$DEPLOY_USER" ]]; then
      info "unchanged: $dir"
    else
      run install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$dir"
    fi
  done
}

step_updates() {
  log "Updates: install security updates automatically every day (no automatic reboot)"
  write_file /etc/apt/apt.conf.d/20auto-upgrades 0644 root:root <<'EOF' || true
// Managed by infra/server/scripts/provision.sh (ADR-020).
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
  # Only Ubuntu's security pocket (the package default). Docker and the rest are upgraded by hand, monthly.
  write_file /etc/apt/apt.conf.d/52upwilling-unattended-upgrades 0644 root:root <<'EOF' || true
// Managed by infra/server/scripts/provision.sh (ADR-020).
// Reboots are done by a human in a quiet hour when /var/run/reboot-required exists (runbook §8).
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
  run systemctl enable --now unattended-upgrades
}

step_fail2ban() {
  log "fail2ban: ban addresses that keep failing SSH logins"
  if write_file /etc/fail2ban/jail.d/50-upwilling.local 0644 root:root <<'EOF'; then
# Managed by infra/server/scripts/provision.sh (ADR-020).
[DEFAULT]
backend = systemd
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF
    run systemctl restart fail2ban
  fi
  run systemctl enable --now fail2ban
}

step_firewall() {
  if is_oracle_cloud_image; then
    step_firewall_oracle
    return
  fi
  log "Firewall: deny incoming except SSH (22), HTTP (80) and HTTPS (443)"
  run ufw default deny incoming
  run ufw default allow outgoing
  run ufw allow 22/tcp comment 'SSH'
  run ufw allow 80/tcp comment 'HTTP (Caddy)'
  run ufw allow 443/tcp comment 'HTTPS (Caddy)'
  run ufw --force enable
  info "Reminder: ports published by Docker bypass ufw. Only Caddy may publish ports (Task 1.4, ADR-020)."
}

# Oracle Cloud images (ADR-021): keep Oracle's iptables rules, insert ACCEPT rules for 80/443 before the INPUT
# REJECT rule, in rules.v4 (persistent) and live. Never `iptables-restore` here: it would flush Docker's rules.
step_firewall_oracle() {
  log "Firewall (Oracle Cloud image): keep Oracle's iptables rules, open 80 and 443 (no ufw on these images)"
  if ufw status 2>/dev/null | grep -q '^Status: active'; then
    die "ufw is active on an Oracle Cloud image; Oracle says this can stop the instance from booting. Run 'ufw disable', then re-run."
  fi
  grep -q '^-A INPUT -j REJECT' "$OCI_RULES_FILE" ||
    die "$OCI_RULES_FILE has no '-A INPUT -j REJECT' line: not the expected Oracle layout. Open 80/443 by hand (runbook §11)."

  local port rule position tmp
  for port in 80 443; do
    rule="-A INPUT -p tcp -m state --state NEW -m tcp --dport $port -j ACCEPT"
    if grep -qxF -- "$rule" "$OCI_RULES_FILE"; then
      info "rules.v4 already accepts $port/tcp"
    elif [[ $DRY_RUN == true ]]; then
      info "[dry-run] insert '$rule' before the INPUT REJECT rule in $OCI_RULES_FILE"
    else
      [[ -f $OCI_RULES_FILE.before-upwilling ]] || cp -p "$OCI_RULES_FILE" "$OCI_RULES_FILE.before-upwilling"
      tmp=$(mktemp)
      awk -v rule="$rule" '!done && /^-A INPUT -j REJECT/ { print rule; done = 1 } { print }' "$OCI_RULES_FILE" >"$tmp"
      # `cat >` keeps the file's owner and mode.
      cat "$tmp" >"$OCI_RULES_FILE"
      rm -f "$tmp"
      info "rules.v4 now accepts $port/tcp (backup: $OCI_RULES_FILE.before-upwilling)"
    fi

    if iptables -S INPUT | grep -Eq -- "--dport $port( |$).*-j ACCEPT"; then
      info "live firewall already accepts $port/tcp"
    else
      position=$(iptables -L INPUT --line-numbers -n | awk '$2 == "REJECT" { print $1; exit }')
      run iptables -I INPUT "${position:-1}" -p tcp -m state --state NEW -m tcp --dport "$port" -j ACCEPT
    fi
  done
  info "Also open 80 and 443 in the VCN security list (runbook §11): it is the outer firewall, and the only one"
  info "that applies to ports published by Docker."
}

step_ssh() {
  log "SSH: keys only, no root login, only $ADMIN_USER and $DEPLOY_USER"
  local admin_home admin_keys
  admin_home=$(getent passwd "$ADMIN_USER" | cut -d: -f6 || true)
  admin_keys="$admin_home/.ssh/authorized_keys"
  if [[ $DRY_RUN != true ]]; then
    # Lockout guards: after this step, the admin key is the only way in, and sudo needs the admin password.
    id "$ADMIN_USER" >/dev/null 2>&1 || die "user $ADMIN_USER does not exist: run the 'users' step first"
    [[ -s $admin_keys ]] || die "$admin_keys is empty: refusing to disable the other logins"
    [[ "$(passwd -S "$ADMIN_USER" | awk '{print $2}')" == "P" ]] ||
      die "$ADMIN_USER has no password, so sudo would not work after root login is disabled. Run: passwd $ADMIN_USER"
  fi

  # 10- sorts before the drop-ins of cloud images (e.g. 50-cloud-init.conf); sshd keeps the first value it reads.
  if write_file /etc/ssh/sshd_config.d/10-upwilling.conf 0644 root:root <<EOF; then
# Managed by infra/server/scripts/provision.sh (ADR-020).
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitEmptyPasswords no
PubkeyAuthentication yes
AuthenticationMethods publickey
AllowUsers ${ADMIN_USER} ${DEPLOY_USER}
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
    if [[ $DRY_RUN != true ]]; then
      # With socket activation (Ubuntu 24.04+) this directory may not exist yet, and `sshd -t` needs it.
      install -d -m 0755 /run/sshd
      if ! sshd -t; then
        rm -f /etc/ssh/sshd_config.d/10-upwilling.conf
        die "sshd rejected the new configuration; it was removed and SSH is unchanged"
      fi
      run systemctl try-reload-or-restart ssh.service
      warn "Keep THIS session open. In a NEW terminal, check:  ssh $ADMIN_USER@<server>  then  sudo -v"
    fi
  fi
}

main() {
  parse_args "$@"
  require_root
  require_supported_os
  local steps step
  steps=$(selected_steps)
  validate_args "$steps"
  [[ $DRY_RUN == true ]] && log "DRY RUN: nothing will be changed"
  for step in $steps; do
    "step_$step"
  done
  log "Done. Next: docs/runbooks/server-setup.md §5 (test the logins, then run verify.sh)."
}

main "$@"
