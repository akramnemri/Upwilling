#!/usr/bin/env bash
# Read-only check of a provisioned server (Task 1.3). Changes nothing. Prints PASS / WARN / FAIL per check and
# the versions to paste into the task report. Exit code 1 if any check fails.
#
# Usage:  sudo bash verify.sh --admin-user <name>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=SCRIPTDIR/lib.sh
. "$SCRIPT_DIR/lib.sh"

readonly DEPLOY_USER="deploy"
readonly APP_DIRS=("/srv/upwilling-prod" "/srv/upwilling-recette")
# TCP ports that may listen on a public interface (Caddy adds 80/443 in Task 1.4).
readonly ALLOWED_PUBLIC_PORTS=(22 80 443)

ADMIN_USER=""
failures=0
warnings=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; failures=$((failures + 1)); }
warn_check() { printf '  WARN  %s\n' "$1"; warnings=$((warnings + 1)); }

# check <description> <command...> — PASS when the command succeeds.
check() {
  local description=$1
  shift
  if "$@" >/dev/null 2>&1; then pass "$description"; else fail "$description"; fi
}

# sshd -T prints one line per value for list options such as allowusers: join them with spaces.
sshd_option_is() {
  [[ "$(sshd -T 2>/dev/null | awk -v key="$1" '$1 == key { $1 = ""; sub(/^ /, ""); print }' | paste -sd ' ')" == "$2" ]]
}
in_group() { id -nG "$1" 2>/dev/null | tr ' ' '\n' | grep -qx "$2"; }
dir_is() { [[ -d $1 && "$(stat -c '%a %U:%G' "$1")" == "$2" ]]; }
ufw_allows() { ufw status | grep -Eq "^$1/tcp +ALLOW"; }
iptables_accepts() { iptables -S INPUT | grep -Eq -- "--dport $1( |$).*-j ACCEPT"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --admin-user) ADMIN_USER=${2:-}; shift 2 ;;
    --help | -h) sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done
[[ -n $ADMIN_USER ]] || die "--admin-user is required"
require_root

log "System"
require_supported_os
check "time zone is UTC" test "$(timedatectl show -p Timezone --value)" = "UTC"
check "clock synchronized (NTP)" test "$(timedatectl show -p NTPSynchronized --value)" = "yes"
check "swap active" test -n "$(swapon --show=NAME --noheadings)"
check "vm.swappiness = 10" test "$(sysctl -n vm.swappiness)" = "10"
check "journal size capped" test -f /etc/systemd/journald.conf.d/50-upwilling.conf
if [[ -f /var/run/reboot-required ]]; then
  warn_check "a reboot is pending (runbook §8)"
else
  pass "no reboot pending"
fi

log "Users"
check "$ADMIN_USER exists and is in the sudo group" in_group "$ADMIN_USER" sudo
check "$ADMIN_USER has a password (needed for sudo)" test "$(passwd -S "$ADMIN_USER" 2>/dev/null | awk '{print $2}')" = "P"
check "$ADMIN_USER has an authorized SSH key" test -s "$(getent passwd "$ADMIN_USER" | cut -d: -f6)/.ssh/authorized_keys"
check "$DEPLOY_USER exists" id "$DEPLOY_USER"
check "$DEPLOY_USER has an authorized SSH key" test -s "$(getent passwd "$DEPLOY_USER" | cut -d: -f6)/.ssh/authorized_keys"
if in_group "$DEPLOY_USER" sudo; then fail "$DEPLOY_USER must not be in the sudo group"; else pass "$DEPLOY_USER has no sudo"; fi
check "$DEPLOY_USER is in the docker group" in_group "$DEPLOY_USER" docker

log "SSH (effective configuration, sshd -T)"
install -d -m 0755 /run/sshd
check "root login disabled" sshd_option_is permitrootlogin no
check "password login disabled" sshd_option_is passwordauthentication no
check "keyboard-interactive login disabled" sshd_option_is kbdinteractiveauthentication no
check "public keys only" sshd_option_is authenticationmethods publickey
check "only $ADMIN_USER and $DEPLOY_USER may log in" sshd_option_is allowusers "$ADMIN_USER $DEPLOY_USER"

log "Firewall and intrusion prevention"
if is_oracle_cloud_image; then
  info "Oracle Cloud image: iptables rules from $OCI_RULES_FILE (ADR-021). Check the VCN security list by hand."
  check "ufw inactive (Oracle: ufw can stop the instance from booting)" bash -c "! ufw status 2>/dev/null | grep -q '^Status: active'"
  check "Oracle essential rules present (chain InstanceServices)" bash -c "iptables -S | grep -q -- '-N InstanceServices'"
  for port in "${ALLOWED_PUBLIC_PORTS[@]}"; do
    check "iptables accepts $port/tcp" iptables_accepts "$port"
    check "rules.v4 keeps $port/tcp open after a reboot" grep -Eq -- "--dport $port( |$).*-j ACCEPT" "$OCI_RULES_FILE"
  done
  check "INPUT ends with a REJECT rule (deny by default)" bash -c "iptables -S INPUT | tail -n 1 | grep -q -- '-j REJECT'"
else
  check "ufw active" bash -c "ufw status | grep -q '^Status: active'"
  check "ufw denies incoming by default" bash -c "ufw status verbose | grep -q 'deny (incoming)'"
  for port in "${ALLOWED_PUBLIC_PORTS[@]}"; do
    check "ufw allows $port/tcp" ufw_allows "$port"
  done
  extra_rules=$(ufw status | grep -E 'ALLOW' | grep -Ev '^(22|80|443)/tcp( \(v6\))? +ALLOW' || true)
  if [[ -n $extra_rules ]]; then fail "ufw has other ALLOW rules: $(echo "$extra_rules" | paste -sd ';')"; else pass "no other ufw ALLOW rules"; fi
fi
check "fail2ban sshd jail running" fail2ban-client status sshd

log "Automatic security updates"
check "unattended upgrades enabled" bash -c "apt-config dump APT::Periodic::Unattended-Upgrade | grep -q '\"1\"'"
check "unattended-upgrades service active" systemctl is-active --quiet unattended-upgrades

log "Docker"
check "Docker daemon active" systemctl is-active --quiet docker
check "Compose plugin installed" docker compose version
check "default log driver json-file" test "$(docker info --format '{{.LoggingDriver}}' 2>/dev/null)" = "json-file"
check "live-restore enabled" test "$(docker info --format '{{.LiveRestoreEnabled}}' 2>/dev/null)" = "true"
check "daemon.json caps container logs" bash -c "grep -q '\"max-size\"' /etc/docker/daemon.json"

log "Layout"
for dir in "${APP_DIRS[@]}"; do
  check "$dir exists, mode 750, owner $DEPLOY_USER" dir_is "$dir" "750 $DEPLOY_USER:$DEPLOY_USER"
done

log "Listening ports (non-loopback TCP)"
# Docker-published ports bypass ufw: anything listening publicly besides 22/80/443 is a finding.
while read -r address; do
  port=${address##*:}
  case $address in
    127.* | \[::1\]:*) continue ;; # loopback: not reachable from outside
    *) ;;
  esac
  if [[ " ${ALLOWED_PUBLIC_PORTS[*]} " == *" $port "* ]]; then
    pass "port $port listening ($address)"
  else
    fail "unexpected public port $port listening ($address)"
  fi
done < <(ss -tlnH | awk '{print $4}' | sort -u)

log "Versions (paste into the task report)"
info "kernel:  $(uname -r)"
info "docker:  $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'not running')"
info "compose: $(docker compose version --short 2>/dev/null || echo 'missing')"
info "ufw:     $(ufw version 2>/dev/null | head -n 1)"
info "openssh: $(ssh -V 2>&1)"

log "Result: $failures failed, $warnings warning(s)"
[[ $failures -eq 0 ]]
