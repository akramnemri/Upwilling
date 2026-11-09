import type { Brand } from "@upwilling/design-system";

import type { HostTarget } from "../core";

/**
 * The visual brand of a request, from its resolved host only (never from the query or a client value).
 * The admin and hooks hosts have no brand of their own: they use the academy theme.
 */
export function brandForHost(target: HostTarget | null): Brand {
  return target?.kind === "site" ? target.tenant : "upwilling";
}
