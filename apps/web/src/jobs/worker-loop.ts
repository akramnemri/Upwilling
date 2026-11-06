import { setTimeout as sleep } from "node:timers/promises";

export interface WorkerLoopOptions {
  /** Aborted on SIGTERM/SIGINT. */
  signal: AbortSignal;
  intervalMs: number;
  runIteration: () => Promise<void>;
}

/**
 * Runs `runIteration` every `intervalMs` until `signal` is aborted. An iteration in progress always
 * finishes (a job is never cut in half); only the wait between iterations is interrupted, so the
 * worker stops well within Docker's stop timeout. An iteration that throws ends the loop with that error.
 */
export async function runWorkerLoop({
  signal,
  intervalMs,
  runIteration,
}: WorkerLoopOptions): Promise<void> {
  while (!signal.aborted) {
    await runIteration();
    try {
      await sleep(intervalMs, undefined, { signal });
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      throw error;
    }
  }
}
