import type { DeployEnv, Env } from "../../../lib/env";
import type { HostTarget, TenantSlug } from "../tenancy/hosts";
import { resolveHost } from "../tenancy/resolve-host";

/**
 * What this process serves (01_ARCHITECTURE.md §5.3). One image runs as several containers;
 * each container only answers for its own hosts, so a bug or overload in one cannot leak into another.
 */
export type AppRole =
  | { kind: "web"; site: TenantSlug }
  | { kind: "cms" }
  | { kind: "worker" }
  // Every role at once: local development and e2e only (env validation refuses it elsewhere: Task 1.1, decision D1).
  | { kind: "all" };

export type RouteDecision = "allow" | "not_found";

// Liveness is checked by Docker from inside the container (Host: localhost), so it bypasses every rule.
// It returns a constant and reads no data, so exposing it on every host leaks nothing.
const LIVENESS_PATH = "/api/health";

// API endpoints a public site may expose. Everything else under /api (Payload's REST and GraphQL APIs
// from Milestone 3, webhooks, internal routes) is refused on public hosts: deny by default.
const SITE_PUBLIC_API_PATHS = new Set(["/api/ready", "/api/version"]);

/** Derives the role from a validated environment. */
export function roleFromEnv(env: Pick<Env, "APP_ROLE" | "SITE">): AppRole {
  switch (env.APP_ROLE) {
    case undefined:
      return { kind: "all" };
    case "web":
      if (env.SITE === undefined) {
        // parseEnv refuses this combination; reaching it means the environment was not validated.
        throw new Error("APP_ROLE=web requires SITE");
      }
      return { kind: "web", site: env.SITE };
    case "cms":
      return { kind: "cms" };
    case "worker":
      return { kind: "worker" };
  }
}

/**
 * Decides whether this process may answer a request. Two independent layers must both allow it:
 * 1. the role decides which hosts this process serves;
 * 2. the kind of host decides which paths exist on it (same rules in every role, including local "all").
 */
export function resolveRoute(request: {
  role: AppRole;
  rawHost: string | null | undefined;
  pathname: string;
  deployEnv: DeployEnv;
}): RouteDecision {
  const { role, rawHost, pathname, deployEnv } = request;
  if (pathname === LIVENESS_PATH) {
    return "allow";
  }

  const target = resolveHost(rawHost, deployEnv);
  const path = normalizePathForRules(pathname);
  if (target === null || path === null) {
    return "not_found";
  }

  return roleServesHost(role, target, deployEnv) && hostServesPath(target, path, deployEnv)
    ? "allow"
    : "not_found";
}

function roleServesHost(role: AppRole, target: HostTarget, deployEnv: DeployEnv): boolean {
  switch (role.kind) {
    case "web":
      return target.kind === "site" && target.tenant === role.site;
    case "cms":
      return target.kind === "admin" || target.kind === "hooks";
    case "worker":
      // The worker serves no HTTP at all; this only matters if someone starts Next.js with that role.
      return false;
    case "all":
      // Startup already refuses this outside local; checked again so a mistake cannot open every host.
      return deployEnv === "local";
  }
}

function hostServesPath(target: HostTarget, path: string, deployEnv: DeployEnv): boolean {
  switch (target.kind) {
    case "site":
      if (isUnder(path, "/admin")) {
        return false;
      }
      if (isUnder(path, "/api")) {
        return (
          SITE_PUBLIC_API_PATHS.has(path) || (deployEnv === "local" && isUnder(path, "/api/dev"))
        );
      }
      return true;
    case "admin":
      return true;
    case "hooks":
      // Webhook receivers only: providers never need anything else on this host.
      return isUnder(path, "/api/webhooks");
  }
}

/**
 * Canonical form of a path for rule matching only (the request itself is not changed): percent-decoded,
 * lowercase, repeated slashes collapsed. Without this, `/%61dmin`, `/ADMIN` or `//admin` could slip past a
 * prefix check while the router still serves them. Returns null for malformed encoding and for `.`/`..`
 * segments left after decoding (`/api/webhooks/..%2fusers`): no legitimate URL needs them.
 */
export function normalizePathForRules(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const path = decoded.toLowerCase().replace(/\/{2,}/g, "/");
  return path.split("/").some((segment) => segment === "." || segment === "..") ? null : path;
}

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}
