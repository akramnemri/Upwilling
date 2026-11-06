import { defineConfig, devices } from "@playwright/test";

import { E2E_PORT } from "./tests/e2e/hosts";

const isCI = process.env.CI !== undefined && process.env.CI !== "";

/**
 * End-to-end tests run against the production build (`next start`), not the dev server, so they see
 * what a container serves. Turbo builds first (`pnpm e2e` depends on `build`).
 * Port 3100 keeps them clear of a `pnpm dev` server on 3000.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // `list` for readable terminal output; the HTML report (with traces) is for digging into failures.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next start --port ${E2E_PORT}`,
    // /api/health answers on any host, so readiness does not depend on *.localhost resolution in Node.
    url: `http://localhost:${E2E_PORT}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 60_000,
    env: { DEPLOY_ENV: "local", LOG_LEVEL: "warn" },
    stdout: "ignore",
    stderr: "pipe",
  },
});
