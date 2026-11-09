import { defineConfig } from "vitest/config";

// Two projects: `tokens` (the token pipeline, in Node) and `react` (the components, in jsdom with
// Testing Library and axe-core). `pnpm test` runs both; `--project <name>` runs one.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "tokens",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "react",
          environment: "jsdom",
          include: ["react/**/*.test.tsx"],
          setupFiles: ["react/testing/setup.ts"],
        },
      },
    ],
  },
});
