import { mkdtemp, rm, utimes } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  checkContainerHealth,
  type HealthCheckResult,
  WORKER_HEARTBEAT_MAX_AGE_MS,
  writeWorkerHeartbeat,
} from "./container-health";

function reasonOf(result: HealthCheckResult): string {
  return result.healthy ? "(healthy)" : result.reason;
}

describe("checkContainerHealth — worker heartbeat", () => {
  let directory: string;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "upwilling-health-"));
  });

  afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("is unhealthy before the first heartbeat", async () => {
    const result = await checkContainerHealth({
      role: "worker",
      heartbeatFile: join(directory, "missing"),
    });
    expect(result.healthy).toBe(false);
  });

  it("is healthy right after a heartbeat", async () => {
    const heartbeatFile = join(directory, "fresh");
    await writeWorkerHeartbeat(heartbeatFile);

    expect(await checkContainerHealth({ role: "worker", heartbeatFile })).toEqual({
      healthy: true,
    });
  });

  it("is unhealthy when the heartbeat is older than the limit (stuck worker)", async () => {
    const heartbeatFile = join(directory, "stale");
    await writeWorkerHeartbeat(heartbeatFile);
    const old = new Date(Date.now() - WORKER_HEARTBEAT_MAX_AGE_MS - 5_000);
    await utimes(heartbeatFile, old, old);

    const result = await checkContainerHealth({ role: "worker", heartbeatFile });
    expect(reasonOf(result)).toContain("s old");
  });

  it("never calls HTTP for the worker role", async () => {
    const heartbeatFile = join(directory, "no-http");
    await writeWorkerHeartbeat(heartbeatFile);

    const result = await checkContainerHealth({
      role: "worker",
      heartbeatFile,
      healthUrl: "http://127.0.0.1:1/unreachable",
    });
    expect(result.healthy).toBe(true);
  });
});

describe("checkContainerHealth — HTTP roles", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      response.statusCode = request.url === "/api/health" ? 200 : 503;
      response.end();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it.each(["web", "cms", undefined] as const)(
    "role %s is healthy when the liveness URL answers 200",
    async (role) => {
      const result = await checkContainerHealth({ role, healthUrl: `${baseUrl}/api/health` });
      expect(result).toEqual({ healthy: true });
    },
  );

  it("is unhealthy on any other status", async () => {
    const result = await checkContainerHealth({ role: "web", healthUrl: `${baseUrl}/broken` });
    expect(reasonOf(result)).toContain("answered 503");
  });

  it("is unhealthy when nothing listens", async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => closed.listen(0, "127.0.0.1", resolve));
    const { port } = closed.address() as AddressInfo;
    await new Promise((resolve) => closed.close(resolve));

    const result = await checkContainerHealth({
      role: "cms",
      healthUrl: `http://127.0.0.1:${port}/api/health`,
    });
    expect(reasonOf(result)).toContain("unreachable");
  });
});
