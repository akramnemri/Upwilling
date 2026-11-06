import { checkContainerHealth } from "./lib/container-health";
import { getEnv } from "./lib/env";

/**
 * Docker HEALTHCHECK entry point, bundled into `dist/healthcheck.cjs` (scripts/bundle-entries.mjs).
 * The slim base image has no curl, so the check is a small Node script. Exit code 0 = healthy.
 */
async function main(): Promise<void> {
  const result = await checkContainerHealth({ role: getEnv().APP_ROLE });
  if (!result.healthy) {
    // Shown by `docker inspect` under State.Health.Log.
    process.stderr.write(`unhealthy: ${result.reason}\n`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `healthcheck failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
