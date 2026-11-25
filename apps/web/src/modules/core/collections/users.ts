import type { CollectionConfig } from "payload";

import { canAccessAdmin, isAuthenticated } from "../access";

/**
 * Accounts that can log into the admin (Task 3.1: administrators only). Roles, tenant assignment and
 * public accounts come in Tasks 3.3 and 3.4.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Utilisateur", plural: "Utilisateurs" },
  admin: {
    useAsTitle: "email",
    description: "Comptes ayant accès à l'administration.",
  },
  auth: {
    // Payload's built-in lockout: 5 failed attempts lock the account for 10 minutes.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  // Deny by default: nothing is readable or writable without a logged-in administrator.
  access: {
    admin: canAccessAdmin,
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    // Email and password are added by `auth`.
    {
      name: "name",
      label: "Nom",
      type: "text",
    },
  ],
};
