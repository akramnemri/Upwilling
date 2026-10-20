#!/usr/bin/env bash
# Shared helpers for provision.sh and verify.sh. Sourced, never run directly.
# Runbook: docs/runbooks/server-setup.md. Decisions: docs/decisions/ADR-020-server-baseline.md

# Ubuntu LTS releases these scripts are written and tested for (ADR-020).
readonly SUPPORTED_UBUNTU_VERSIONS=("24.04" "26.04")

DRY_RUN=false

log() { printf '\n==> %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
warn() { printf '    WARNING: %s\n' "$*" >&2; }
die() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

# Runs a command that changes the system, or only prints it in dry-run mode.
run() {
  if [[ $DRY_RUN == true ]]; then
    printf '    [dry-run] %s\n' "$*"
  else
    printf '    + %s\n' "$*"
    "$@"
  fi
}

require_root() {
  [[ $EUID -eq 0 ]] || die "run as root (for example: sudo bash $0 ...)"
}

require_supported_os() {
  [[ -r /etc/os-release ]] || die "/etc/os-release not found: not a supported Ubuntu server"
  # shellcheck source=/dev/null
  . /etc/os-release
  [[ ${ID:-} == "ubuntu" ]] || die "expected Ubuntu, found '${ID:-unknown}' (ADR-020)"
  local version
  for version in "${SUPPORTED_UBUNTU_VERSIONS[@]}"; do
    if [[ ${VERSION_ID:-} == "$version" ]]; then
      info "OS: ${PRETTY_NAME:-Ubuntu $VERSION_ID}"
      return 0
    fi
  done
  die "Ubuntu ${VERSION_ID:-?} is not supported; use one of: ${SUPPORTED_UBUNTU_VERSIONS[*]} (ADR-020)"
}

# write_file <path> <mode> <owner:group> — content from stdin. Writes only when the content, mode or owner
# differ, so a second run changes nothing. Returns 0 when the file changed, 1 when it was already up to date.
write_file() {
  local path=$1 mode=$2 owner=$3 content
  content=$(cat)
  if [[ -f $path ]] && [[ "$(cat "$path")" == "$content" ]] &&
    [[ "$(stat -c '%a %U:%G' "$path")" == "${mode#0} $owner" ]]; then
    info "unchanged: $path"
    return 1
  fi
  if [[ $DRY_RUN == true ]]; then
    printf '    [dry-run] write %s (mode %s, owner %s):\n' "$path" "$mode" "$owner"
    printf '%s\n' "$content" | sed 's/^/        | /'
    return 0
  fi
  local tmp
  tmp=$(mktemp)
  printf '%s\n' "$content" >"$tmp"
  install -D -m "$mode" -o "${owner%%:*}" -g "${owner##*:}" "$tmp" "$path"
  rm -f "$tmp"
  info "written: $path"
  return 0
}

# Refuses anything that is not exactly one SSH public key (a private key must never be copied to the server).
validate_public_key_file() {
  local file=$1
  [[ -f $file ]] || die "public key file not found: $file"
  if grep -q "PRIVATE KEY" "$file"; then
    die "$file contains a PRIVATE key. Copy only the .pub file to the server, and treat that private key as exposed."
  fi
  [[ $(grep -cv '^[[:space:]]*$' "$file") -eq 1 ]] || die "$file must contain exactly one public key line"
  ssh-keygen -l -f "$file" >/dev/null 2>&1 || die "$file is not a valid SSH public key"
}
