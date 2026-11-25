import { getPayload, type Migration } from "payload";

import { installConsoleScrubbing } from "../lib/console-scrubbing";
import { EnvValidationError, getEnv } from "../lib/env";
import { migrations } from "../migrations";
import config from "../payload.config";

/**
 * One-off migration container (`APP_ROLE=migrate`, Task 3.1b), bundled into `dist/migrate.mjs`
 * (scripts/bundle-entries.mjs). The deploy agent runs it after the pre-migration backup and before the
 * new containers start; a non-zero exit stops the deploy and leaves the running release untouched.
 *
 * The migrations are imported, not read from disk: the image ships no TypeScript sources. Each migration
 * runs in its own transaction (Payload); a failing one is rolled back and Payload exits with code 1.
 */
installConsoleScrubbing();
try {
  getEnv();
} catch (error) {
  if (error instanceof EnvValidationError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
  throw error;
}

const payload = await getPayload({ config });
let exitCode = 0;
try {
  // Payload's generic adapter type declares `up(args: unknown)`, while the generated migrations declare the
  // Postgres adapter's own argument types, which is what Payload passes them at runtime. Typing gap only.
  await payload.db.migrate({ migrations: migrations as unknown as Migration[] });
  payload.logger.info("Migrations: database up to date.");
} catch (error) {
  payload.logger.error({ err: error, msg: "Migrations failed" });
  exitCode = 1;
} finally {
  await payload.destroy();
}
// Payload keeps timers alive after destroy(); its own CLI ends with process.exit for the same reason.
process.exit(exitCode);
