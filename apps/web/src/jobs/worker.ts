import { installConsoleScrubbing } from "../lib/console-scrubbing";
import { WORKER_HEARTBEAT_INTERVAL_MS, writeWorkerHeartbeat } from "../lib/container-health";
import { EnvValidationError, getEnv } from "../lib/env";
import { normalizeError } from "../lib/errors";
import { getLogger } from "../lib/logger";
import { runWorkerLoop } from "./worker-loop";

/**
 * Worker container entry point (`APP_ROLE=worker`, 01_ARCHITECTURE.md §5.3), bundled into
 * `dist/worker.cjs` (scripts/bundle-entries.mjs). It never serves HTTP.
 *
 * Placeholder until Task 3.5: no jobs yet. It proves the container contract: validated environment,
 * structured logs, a heartbeat for the Docker healthcheck, and a clean exit (code 0) on SIGTERM.
 */
const OPERATION = "worker.loop";

function validateEnvOrExit(): void {
  try {
    getEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // Same behaviour as the web server (instrumentation.node.ts): the logger needs a valid environment.
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

async function main(): Promise<void> {
  installConsoleScrubbing();
  validateEnvOrExit();
  const logger = getLogger().child({ operation: OPERATION });

  const controller = new AbortController();
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    // `once`: a second signal falls back to Node's default and kills the process immediately.
    process.once(signal, () => {
      logger.info({ signal }, "worker stopping");
      controller.abort();
    });
  }

  logger.info({ intervalMs: WORKER_HEARTBEAT_INTERVAL_MS }, "worker started");
  await runWorkerLoop({
    signal: controller.signal,
    intervalMs: WORKER_HEARTBEAT_INTERVAL_MS,
    runIteration: async () => {
      // Task 3.5: run the Payload jobs queue here.
      await writeWorkerHeartbeat();
      logger.debug("worker heartbeat");
    },
  });
  logger.info("worker stopped");
}

main().catch((error: unknown) => {
  getLogger().fatal({ operation: OPERATION, err: normalizeError(error) }, "worker crashed");
  // Non-zero exit: Docker's restart policy brings the worker back.
  process.exitCode = 1;
});
