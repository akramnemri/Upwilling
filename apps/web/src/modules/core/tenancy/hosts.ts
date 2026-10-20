import type { DeployEnv } from "../../../lib/env";

export const TENANT_SLUGS = ["upwilling", "careerboost"] as const;
export type TenantSlug = (typeof TENANT_SLUGS)[number];

/** What a known host serves. Public sites carry their tenant; admin and hooks hosts are tenant-less. */
export type HostTarget =
  { kind: "site"; tenant: TenantSlug } | { kind: "admin" } | { kind: "hooks" };

/**
 * Static allowlist of hosts per deployment environment (01_ARCHITECTURE.md §5.2, §6).
 * Any host not listed here is answered with 404. `www.` hosts are deliberately absent:
 * Caddy redirects `www` to the apex before requests reach the app.
 */
const HOSTS_BY_ENV: Readonly<Record<DeployEnv, ReadonlyMap<string, HostTarget>>> = {
  local: new Map<string, HostTarget>([
    ["upwilling.localhost", { kind: "site", tenant: "upwilling" }],
    ["careerboost.localhost", { kind: "site", tenant: "careerboost" }],
    ["admin.localhost", { kind: "admin" }],
  ]),
  // Test phase only (ADR-022): first-level hosts of upwilling.fr, so cookies must stay host-only.
  // Remove these when recette moves to its own domain (ADR-017), before accepting traffic.
  recette: new Map<string, HostTarget>([
    ["recette.upwilling.fr", { kind: "site", tenant: "upwilling" }],
    ["recette-careerboost.upwilling.fr", { kind: "site", tenant: "careerboost" }],
    ["recette-admin.upwilling.fr", { kind: "admin" }],
    ["recette-hooks.upwilling.fr", { kind: "hooks" }],
  ]),
  production: new Map<string, HostTarget>([
    ["upwilling.fr", { kind: "site", tenant: "upwilling" }],
    ["careerboost.upwilling.fr", { kind: "site", tenant: "careerboost" }],
    ["admin.upwilling.fr", { kind: "admin" }],
    ["hooks.upwilling.fr", { kind: "hooks" }],
  ]),
};

export function hostsFor(deployEnv: DeployEnv): ReadonlyMap<string, HostTarget> {
  return HOSTS_BY_ENV[deployEnv];
}
