import { describe, expect, it } from "vitest";

import { parseEnv } from "../../src/lib/env";

// Placeholder that keeps the `integration` project wired and running until the database exists (ADR-005).
// Database-backed tests (separate test database, reset per run) replace it once a database is chosen.
describe("integration test environment", () => {
  it("runs as a local deployment with a valid environment", () => {
    expect(parseEnv(process.env).DEPLOY_ENV).toBe("local");
  });
});
