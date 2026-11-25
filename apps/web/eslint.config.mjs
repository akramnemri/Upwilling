import { nextConfig } from "@upwilling/config/eslint/next";

import designTokenRules from "./eslint.design-tokens.mjs";

const config = [
  ...nextConfig,
  ...designTokenRules,
  {
    // Payload writes every migration with the same signature, `({ db, payload, req })`, and value imports
    // of its types. Let generated migrations pass as they are instead of hand-editing each one.
    files: ["src/migrations/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];

export default config;
