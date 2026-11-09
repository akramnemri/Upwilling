import { join } from "node:path";

import { designTokenRules } from "@upwilling/config/eslint/design-tokens";

/**
 * Design-token rules for the application's code (shared with the design system's components:
 * @upwilling/config/eslint/design-tokens). CSS files are checked by Stylelint (stylelint.config.mjs).
 * Also loaded alone by tests/lint.
 */

const WEB_ROOT = import.meta.dirname;

const webDesignTokenRules = designTokenRules({
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/**/*.test.{ts,tsx}"],
  cwd: WEB_ROOT,
  entryPoint: join(WEB_ROOT, "src/app/globals.css"),
});

export default webDesignTokenRules;
