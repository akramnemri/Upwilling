import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Two projects: `unit` (fast, no external service) and `integration` (real PostgreSQL: start it with
// `docker compose -f infra/local/compose.yaml up -d postgres`). `pnpm test` runs both; `--project <name>`
// runs one.
export default defineConfig({
  // Same alias as tsconfig.json: Payload's convention for importing its configuration.
  resolve: {
    alias: {
      "@payload-config": fileURLToPath(new URL("./src/payload.config.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Code under test calls getEnv(); tests run as a local deployment unless they parse their own env.
    env: { DEPLOY_ENV: "local", LOG_LEVEL: "fatal" },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "tests/factories/**/*.test.ts", "tests/lint/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          env: {
            // The test database is rebuilt by every run: never point this at a database you care about.
            // Same local-only credentials as infra/local/compose.yaml and CI's service container.
            DATABASE_URL: "postgres://app:app-local-only@127.0.0.1:55432/app_test",
            PAYLOAD_SECRET: "integration-tests-only-not-a-real-secret",
            MEDIA_DIR: join(tmpdir(), "upwilling-integration-media"),
          },
          // Opening Payload and rebuilding the schema takes a few seconds on a laptop.
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
