import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

import { baseConfig } from "./base.mjs";

/** ESLint flat config for the Next.js application: base rules + Next.js Core Web Vitals rules. */
export const nextConfig = defineConfig([
  ...nextVitals,
  ...baseConfig,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default nextConfig;
