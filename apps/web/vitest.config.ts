import { defineConfig } from "vitest/config";

// Minimal unit-test setup brought forward from Task 0.5, which adds integration tests and Playwright.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Code under test calls getEnv(); tests run as a local deployment unless they parse their own env.
    env: { DEPLOY_ENV: "local", LOG_LEVEL: "fatal" },
  },
});
