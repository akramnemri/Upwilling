import { describe, expect, it } from "vitest";

import { runWorkerLoop } from "./worker-loop";

describe("runWorkerLoop", () => {
  it("repeats iterations until the signal is aborted", async () => {
    const controller = new AbortController();
    let iterations = 0;

    await runWorkerLoop({
      signal: controller.signal,
      intervalMs: 1,
      runIteration: () => {
        iterations += 1;
        if (iterations === 3) {
          controller.abort();
        }
        return Promise.resolve();
      },
    });

    expect(iterations).toBe(3);
  });

  it("runs no iteration when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    let iterations = 0;

    await runWorkerLoop({
      signal: controller.signal,
      intervalMs: 1,
      runIteration: () => {
        iterations += 1;
        return Promise.resolve();
      },
    });

    expect(iterations).toBe(0);
  });

  it("stops during the wait without waiting for the full interval (SIGTERM)", async () => {
    const controller = new AbortController();
    let iterations = 0;
    const startedAt = Date.now();

    const loop = runWorkerLoop({
      signal: controller.signal,
      intervalMs: 60_000,
      runIteration: () => {
        iterations += 1;
        return Promise.resolve();
      },
    });
    setTimeout(() => controller.abort(), 20);
    await loop;

    expect(iterations).toBe(1);
    expect(Date.now() - startedAt).toBeLessThan(5_000);
  });

  it("lets an iteration in progress finish, then starts no new one", async () => {
    const controller = new AbortController();
    const events: string[] = [];

    await runWorkerLoop({
      signal: controller.signal,
      intervalMs: 1,
      runIteration: async () => {
        events.push("start");
        controller.abort();
        await new Promise((resolve) => setTimeout(resolve, 10));
        events.push("end");
      },
    });

    expect(events).toEqual(["start", "end"]);
  });

  it("ends with the error of a failing iteration", async () => {
    const controller = new AbortController();

    await expect(
      runWorkerLoop({
        signal: controller.signal,
        intervalMs: 1,
        runIteration: () => Promise.reject(new Error("heartbeat write failed")),
      }),
    ).rejects.toThrow("heartbeat write failed");
  });
});
