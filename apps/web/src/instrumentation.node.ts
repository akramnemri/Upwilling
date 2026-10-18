import { EnvValidationError, getEnv } from "./lib/env";

/**
 * Node.js-only startup checks. On invalid configuration we exit instead of throwing: Next.js only logs a
 * failed instrumentation hook and keeps the server listening, which would leave a container that looks
 * alive (Docker healthcheck green) but cannot serve a single request.
 */
export function runStartupChecks(): void {
  try {
    getEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // The structured logger arrives in Task 0.4; stderr keeps this readable in `docker logs`.
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}
