import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint flat config for every TypeScript package.
 * Type-aware rules catch unhandled promises and unsafe `any` flows, which plain linting misses.
 */
export const baseConfig = defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/dist/**",
    "**/coverage/**",
    "**/playwright-report/**",
    "**/blob-report/**",
    "**/test-results/**",
  ]),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "always"],
      "no-console": "error",
    },
  },
  {
    // Config files (eslint.config.mjs, etc.) are not part of any tsconfig project.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
]);

export default baseConfig;
