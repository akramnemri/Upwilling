#!/usr/bin/env bash
# Tests provision.sh and verify.sh on a throwaway Ubuntu container with systemd (a stand-in for a fresh VPS).
# Developer machines only: needs Docker and runs one PRIVILEGED container (systemd, ufw and Docker inside it),
# which is removed at the end. Never run against a real server.
#
#   bash infra/server/test/test-in-container.sh              # Ubuntu 26.04, generic VPS (ufw)
#   bash infra/server/test/test-in-container.sh 24.04        # Ubuntu 24.04, generic VPS
#   bash infra/server/test/test-in-container.sh 26.04 --oci  # Oracle Cloud image (iptables rules, no ufw; ADR-021)
#
# The swap and time steps are skipped: swap, vm.swappiness and the clock are not namespaced, so inside a
# privileged container they would change the Docker host itself. Everything else runs for real, twice
# (the second run must change nothing).
set -euo pipefail

UBUNTU_VERSION=${1:-26.04}
ORACLE_MODE=false
[[ ${2:-} == "--oci" ]] && ORACLE_MODE=true
case $UBUNTU_VERSION in
  26.04) UBUNTU_IMAGE="ubuntu:26.04@sha256:c098726dd9b9733f3e885f8de0ef375206a311b0a317eadc40d347b1115fb944" ;;
  24.04) UBUNTU_IMAGE="ubuntu:24.04@sha256:68ee22004a9109b44973313b02ff7b1de250f1de0f5ecb628d73f579aaff33ac" ;;
  *) echo "Ubuntu $UBUNTU_VERSION is not supported by these scripts" >&2; exit 1 ;;
esac

TEST_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS_DIR="$(cd "$TEST_DIR/../scripts" && pwd)"
IMAGE="upwilling-provision-test:$UBUNTU_VERSION"
CONTAINER="upwilling-provision-test"
ADMIN="opsadmin" # synthetic test user
STEPS_IN_CONTAINER="packages,journald,users,docker,layout,updates,fail2ban,firewall,ssh"
failures=0

# Git Bash on Windows rewrites /paths in arguments; Docker needs them as they are.
export MSYS_NO_PATHCONV=1
host_path() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }
in_box() { docker exec "$CONTAINER" bash -c "$1"; }
pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

# -v: also removes the anonymous volumes holding the inner Docker's data.
cleanup() { docker rm -f -v "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "== Building the test image ($UBUNTU_IMAGE)"
docker build -q --build-arg "UBUNTU_IMAGE=$UBUNTU_IMAGE" -t "$IMAGE" "$(host_path "$TEST_DIR")" >/dev/null

echo "== Starting a fresh 'server' container"
cleanup
# Docker inside the container needs its own volumes: overlayfs cannot be stacked on the container's overlay root.
docker run -d --name "$CONTAINER" --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -v /var/lib/docker -v /var/lib/containerd \
  -v "$(host_path "$SCRIPTS_DIR"):/opt/provision:ro" -v "$(host_path "$TEST_DIR"):/opt/provision-test:ro"   "$IMAGE" >/dev/null
for _ in $(seq 1 30); do
  state=$(in_box "systemctl is-system-running 2>/dev/null" || true)
  [[ $state == "running" || $state == "degraded" ]] && break
  sleep 1
done

if [[ $ORACLE_MODE == true ]]; then
  echo "== Making it look like an Oracle Cloud image (iptables-persistent + Oracle-style rules.v4)"
  in_box "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables iptables-persistent >/dev/null     && install -m 0644 /opt/provision-test/oci-rules.v4 /etc/iptables/rules.v4 && iptables-restore < /etc/iptables/rules.v4"
fi

echo "== Creating synthetic SSH keys (test only, deleted with the container)"
in_box "ssh-keygen -q -t ed25519 -N '' -C test-admin -f /root/admin_key && ssh-keygen -q -t ed25519 -N '' -C test-deploy -f /root/deploy_key"
ARGS="--admin-user $ADMIN --admin-key /root/admin_key.pub --deploy-key /root/deploy_key.pub"

# run_step <description> <command in the container> — fails the test (with the output) if the command fails.
run_step() {
  local output
  if output=$(in_box "$2" 2>&1); then
    pass "$1"
  else
    fail "$1"
    tail -n 25 <<<"$output" | sed 's/^/        /'
    exit 1
  fi
}

echo "== Dry run (must change nothing)"
run_step "dry run completed" "bash /opt/provision/provision.sh $ARGS --dry-run"
if in_box "id $ADMIN" >/dev/null 2>&1; then fail "dry run created a user"; else pass "dry run changed nothing"; fi

echo "== ssh step refuses to run before the admin has a password (lockout guard)"
if in_box "bash /opt/provision/provision.sh $ARGS --only packages,users,ssh" >/dev/null 2>&1; then
  fail "ssh step ran without an admin password"
else
  pass "ssh step refused"
fi

echo "== Real run"
in_box "echo '$ADMIN:$(head -c 18 /dev/urandom | base64)' | chpasswd"
run_step "provision.sh completed" "bash /opt/provision/provision.sh $ARGS --only $STEPS_IN_CONTAINER"

echo "== Second run (must change nothing)"
second=$(in_box "bash /opt/provision/provision.sh $ARGS --only $STEPS_IN_CONTAINER")
if grep -qE 'written:|authorized SHA256|useradd|usermod -aG' <<<"$second"; then
  fail "second run changed something:"
  grep -E 'written:|authorized SHA256|useradd|usermod -aG' <<<"$second"
else
  pass "second run changed nothing"
fi

if [[ $ORACLE_MODE == true ]]; then
  echo "== Oracle Cloud firewall"
  if in_box "ufw status | grep -q '^Status: active'"; then fail "ufw was enabled"; else pass "ufw left disabled"; fi
  for port in 80 443; do
    count=$(in_box "grep -c -- '--dport $port -j ACCEPT' /etc/iptables/rules.v4" || true)
    if [[ $count == "1" ]]; then pass "rules.v4 opens $port/tcp exactly once (after two runs)"; else fail "rules.v4 has $count rule(s) for $port/tcp"; fi
  done
  if in_box "iptables -S INPUT | tail -n 1 | grep -q -- '-j REJECT'"; then pass "INPUT still ends with REJECT"; else fail "INPUT no longer ends with REJECT"; fi
  if in_box "iptables -S | grep -q -- '-A InstanceServices'"; then pass "Oracle essential rules kept"; else fail "InstanceServices rules lost"; fi
  if in_box "grep -q 'InstanceServices' /etc/iptables/rules.v4.before-upwilling"; then pass "original rules.v4 backed up"; else fail "no rules.v4 backup"; fi
fi

echo "== Container networking (outbound traffic goes through the FORWARD chain)"
if in_box "docker run --rm busybox:1.37@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e \
  wget -q --spider -T 10 https://download.docker.com/" >/dev/null 2>&1; then
  pass "a container can reach the internet"
else
  fail "a container cannot reach the internet"
fi

echo "== verify.sh (swap and time checks are expected to fail here, see the header)"
report=$(in_box "bash /opt/provision/verify.sh --admin-user $ADMIN" || true)
unexpected=$(grep '  FAIL ' <<<"$report" | grep -vE 'swap active|vm.swappiness|time zone is UTC|clock synchronized' || true)
if [[ -n $unexpected ]]; then fail "verify.sh found problems:"; echo "$unexpected"; else pass "verify.sh: everything else passes"; fi
grep -A6 'Versions' <<<"$report" | sed 's/^/        /'

echo "== SSH behaviour"
SSH="ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5"
if in_box "$SSH -i /root/admin_key $ADMIN@127.0.0.1 true" 2>/dev/null; then pass "admin logs in with its key"; else fail "admin key login"; fi
if in_box "$SSH -i /root/deploy_key deploy@127.0.0.1 docker ps" >/dev/null 2>&1; then pass "deploy logs in and can use docker"; else fail "deploy key login"; fi
if in_box "$SSH -i /root/admin_key root@127.0.0.1 true" 2>/dev/null; then fail "root login accepted"; else pass "root login refused"; fi
if in_box "$SSH -i /root/deploy_key $ADMIN@127.0.0.1 true" 2>/dev/null; then fail "admin accepted the deploy key"; else pass "keys are not interchangeable"; fi
if in_box "$SSH -o PreferredAuthentications=password,keyboard-interactive $ADMIN@127.0.0.1 true" 2>/dev/null; then
  fail "password login accepted"
else
  pass "password login refused"
fi
if in_box "$SSH -i /root/deploy_key deploy@127.0.0.1 sudo -n true" 2>/dev/null; then fail "deploy can sudo"; else pass "deploy cannot sudo"; fi

echo "== Result"
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed."
  exit 1
fi
echo "All provisioning checks passed on Ubuntu $UBUNTU_VERSION$([[ $ORACLE_MODE == true ]] && echo ' (Oracle Cloud mode)')."
