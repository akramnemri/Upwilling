import type { DeployEnv } from "../../../lib/env";
import { hostsFor, type HostTarget } from "./hosts";

// A hostname made only of DNS labels. Anything else (userinfo, paths, spaces, IPv6 literals) is refused.
const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

/**
 * Normalizes a raw `Host` header value: lowercase, port removed, one trailing dot removed.
 * Returns null when the value cannot be a plain hostname.
 */
export function normalizeHost(rawHost: string | null | undefined): string | null {
  if (!rawHost) {
    return null;
  }

  let host = rawHost.trim().toLowerCase();
  const portSeparator = host.lastIndexOf(":");
  if (portSeparator !== -1) {
    const port = host.slice(portSeparator + 1);
    if (!/^\d{1,5}$/.test(port)) {
      return null;
    }
    host = host.slice(0, portSeparator);
  }
  if (host.endsWith(".")) {
    host = host.slice(0, -1);
  }

  return HOSTNAME_PATTERN.test(host) ? host : null;
}

/**
 * Resolves what the request host serves. This is the ONLY way to determine the tenant:
 * never from query strings, bodies, cookies or other client-controlled values (CLAUDE.md).
 * Returns null for unknown hosts, which callers must answer with 404.
 */
export function resolveHost(
  rawHost: string | null | undefined,
  deployEnv: DeployEnv,
): HostTarget | null {
  const host = normalizeHost(rawHost);
  if (host === null) {
    return null;
  }
  return hostsFor(deployEnv).get(host) ?? null;
}
