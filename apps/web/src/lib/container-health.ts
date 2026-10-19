import { stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Env } from "./env";

/**
 * Container liveness, as seen by Docker's HEALTHCHECK (01_ARCHITECTURE.md §5.3, §10).
 * Liveness only: no dependency is checked here, so a database outage never triggers restart storms.
 */

/** The image's Next.js server always listens on this port (Dockerfile `ENV PORT`). */
export const CONTAINER_HTTP_PORT = 3000;

const DEFAULT_HEALTH_URL = `http://127.0.0.1:${CONTAINER_HTTP_PORT}/api/health`;
const HTTP_TIMEOUT_MS = 3_000;

// The worker serves no HTTP, so its liveness is a file it rewrites on every loop iteration.
export const WORKER_HEARTBEAT_FILE = join(tmpdir(), "upwilling-worker-heartbeat");
export const WORKER_HEARTBEAT_INTERVAL_MS = 10_000;
// Several missed heartbeats before the worker counts as stuck: one slow iteration is not an outage.
export const WORKER_HEARTBEAT_MAX_AGE_MS = 60_000;

export type HealthCheckResult = { healthy: true } | { healthy: false; reason: string };

export async function writeWorkerHeartbeat(file: string = WORKER_HEARTBEAT_FILE): Promise<void> {
  await writeFile(file, new Date().toISOString());
}

export interface ContainerHealthOptions {
  role: Env["APP_ROLE"];
  /** Overridable for tests. */
  healthUrl?: string;
  heartbeatFile?: string;
  now?: number;
}

/** `worker` is alive when its heartbeat is recent; every other role when `/api/health` answers 200. */
export async function checkContainerHealth(
  options: ContainerHealthOptions,
): Promise<HealthCheckResult> {
  if (options.role === "worker") {
    return checkWorkerHeartbeat(
      options.heartbeatFile ?? WORKER_HEARTBEAT_FILE,
      options.now ?? Date.now(),
    );
  }
  return checkHttpLiveness(options.healthUrl ?? DEFAULT_HEALTH_URL);
}

async function checkWorkerHeartbeat(file: string, now: number): Promise<HealthCheckResult> {
  let modifiedAt: number;
  try {
    modifiedAt = (await stat(file)).mtimeMs;
  } catch (error) {
    return { healthy: false, reason: `no worker heartbeat file (${describe(error)})` };
  }
  const ageMs = now - modifiedAt;
  return ageMs <= WORKER_HEARTBEAT_MAX_AGE_MS
    ? { healthy: true }
    : { healthy: false, reason: `worker heartbeat is ${Math.round(ageMs / 1000)} s old` };
}

async function checkHttpLiveness(url: string): Promise<HealthCheckResult> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
    return response.status === 200
      ? { healthy: true }
      : { healthy: false, reason: `${url} answered ${response.status}` };
  } catch (error) {
    return { healthy: false, reason: `${url} unreachable (${describe(error)})` };
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
