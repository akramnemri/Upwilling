import { defineConfig } from "vitest/config";

// Minimal unit-test setup brought forward from Task 0.5, which adds integration tests and Playwright.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
