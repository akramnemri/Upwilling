// Public interface of the `core` module: other modules import from here only (01_ARCHITECTURE.md §7).
export { TENANT_SLUGS, type HostTarget, type TenantSlug } from "./tenancy/hosts";
export { normalizeHost, resolveHost } from "./tenancy/resolve-host";
