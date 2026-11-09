import { join } from "node:path";

import { baseConfig } from "@upwilling/config/eslint/base";
import { designTokenRules } from "@upwilling/config/eslint/design-tokens";

const PACKAGE_ROOT = import.meta.dirname;

// The React components follow the same token rules as the application: theme classes only, no raw
// color, no arbitrary value. The token sources and the generator (src/, tokens/) define raw values.
const config = [
  ...baseConfig,
  ...designTokenRules({
    files: ["react/**/*.{ts,tsx}"],
    ignores: ["react/**/*.test.{ts,tsx}"],
    cwd: PACKAGE_ROOT,
    entryPoint: join(PACKAGE_ROOT, "css/tailwind.css"),
  }),
];

export default config;
