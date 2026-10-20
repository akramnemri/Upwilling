import { describe, expect, it } from "vitest";

import { AppError } from "../../lib/errors";
import { withErrorHandling } from "../../lib/http/route-handler";
import { GET as testErrorGet } from "./dev/test-error/route";
import { GET as healthGet } from "./health/route";
import { GET as readyGet } from "./ready/route";
import { GET as versionGet } from "./version/route";

function requestWithId(url: string, requestId = "req-test") {
  return new Request(url, { headers: { "x-request-id": requestId } });
}

describe("GET /api/health", () => {
  it("returns 200 ok without caching", async () => {
    const response = healthGet();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("GET /api/ready", () => {
  it("is ready when the configuration is valid; the database check is a placeholder (ADR-005)", async () => {
    const response = readyGet();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      checks: { config: "ok", database: "not_configured" },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("GET /api/version", () => {
  it('returns the version baked into the image ("local" outside a published image), without caching', async () => {
    const response = versionGet();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: "local" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("withErrorHandling", () => {
  it("returns the standard JSON body for an AppError, with its status and the request ID", async () => {
    const handler = withErrorHandling("test.expected", () =>
      Promise.reject(new AppError("BAD_REQUEST", "Requête invalide.", { status: 400 })),
    );
    const response = await handler(requestWithId("http://upwilling.localhost/api/x", "req-a"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "BAD_REQUEST", message: "Requête invalide.", requestId: "req-a" },
    });
    expect(response.headers.get("x-request-id")).toBe("req-a");
  });

  it("turns an unexpected error into a generic 500 without leaking its message", async () => {
    const handler = withErrorHandling("test.unexpected", () =>
      Promise.reject(new Error("db password=hunter2")),
    );
    const response = await handler(requestWithId("http://upwilling.localhost/api/x"));
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("INTERNAL_ERROR");
    expect(text).not.toContain("hunter2");
  });

  it("passes successful responses through untouched", async () => {
    const handler = withErrorHandling("test.ok", () =>
      Promise.resolve(Response.json({ ok: true })),
    );
    const response = await handler(requestWithId("http://upwilling.localhost/api/x"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("GET /api/dev/test-error (local only)", () => {
  it("returns a generic 500 for the unexpected kind, never the fake secrets", async () => {
    const response = await testErrorGet(
      requestWithId("http://upwilling.localhost/api/dev/test-error"),
    );
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("fake-token-123");
  });

  it("returns the AppError for the expected kind", async () => {
    const response = await testErrorGet(
      requestWithId("http://upwilling.localhost/api/dev/test-error?kind=expected"),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "DEV_TEST_ERROR" } });
  });
});
