import type { Access, PayloadRequest } from "payload";

/**
 * Any logged-in admin user. Until Task 3.3 adds roles, every account is an administrator account
 * (created by the seed or by an existing administrator), so this is the strictest rule we can express.
 * Task 3.3 replaces its uses with role- and tenant-aware helpers.
 */
export const isAuthenticated: Access = ({ req }) => req.user !== null && req.user !== undefined;

/** Admin panel access: same rule as `isAuthenticated`, typed for `access.admin`. */
export function canAccessAdmin({ req }: { req: PayloadRequest }): boolean {
  return req.user !== null && req.user !== undefined;
}
