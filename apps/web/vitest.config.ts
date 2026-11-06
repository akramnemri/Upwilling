import { defineConfig } from "vitest/config";

// Two projects: `unit` (fast, no external service) and `integration` (real local services; the database
// joins when ADR-005 provides one). `pnpm test` runs both; `--project <name>` runs one.
export default defineConfig({
  test: {
    environment: "node",
    // Code under test calls getEnv(); tests run as a local deployment unless they parse their own env.
    env: { DEPLOY_ENV: "local", LOG_LEVEL: "fatal" },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "tests/factories/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
        },
      },
    ],
  },
});
