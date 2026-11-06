import type { DeployEnv } from "../../lib/env";
import type { HostTarget } from "../core";

export const X_ROBOTS_TAG_HEADER = "x-robots-tag";
export const NO_INDEX_VALUE = "noindex, nofollow";

/**
 * Only a public site in production may appear in search results (TR-13). Recette and local copies,
 * the admin and hooks hosts, and refused hosts never may. One rule for the `robots` meta tag and the
 * `X-Robots-Tag` header: the header also covers responses without HTML (404s, images, API routes)
 * and does not depend on where Next.js streams the meta tag.
 */
export function isIndexable(target: HostTarget | null, deployEnv: DeployEnv): boolean {
  return deployEnv === "production" && target?.kind === "site";
}
