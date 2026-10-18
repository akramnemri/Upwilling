import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function requestFor(host: string, path = "/", extraHeaders: Record<string, string> = {}) {
  return new NextRequest(`http://${host}${path}`, { headers: { host, ...extraHeaders } });
}

describe("proxy", () => {
  it("lets known hosts through with a fresh request ID on the response", () => {
    const response = proxy(requestFor("upwilling.localhost:3000"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(UUID_PATTERN);
  });

  it("forwards the same request ID to the route (as a request header)", () => {
    const response = proxy(requestFor("careerboost.localhost:3000"));
    // Next.js transports overridden request headers to the route through this internal response header.
    expect(response.headers.get("x-middleware-request-x-request-id")).toBe(
      response.headers.get("x-request-id"),
    );
  });

  it("overwrites a request ID sent by the client", () => {
    const response = proxy(
      requestFor("upwilling.localhost:3000", "/", { "x-request-id": "client-chosen" }),
    );
    expect(response.headers.get("x-request-id")).not.toBe("client-chosen");
    expect(response.headers.get("x-middleware-request-x-request-id")).not.toBe("client-chosen");
  });

  it("gives every request a different ID", () => {
    const first = proxy(requestFor("upwilling.localhost:3000")).headers.get("x-request-id");
    const second = proxy(requestFor("upwilling.localhost:3000")).headers.get("x-request-id");
    expect(first).not.toBe(second);
  });

  it("answers 404 for unknown hosts, still with a request ID", async () => {
    const response = proxy(requestFor("unknown.localhost:3000"));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
    expect(response.headers.get("x-request-id")).toMatch(UUID_PATTERN);
  });

  it("serves the liveness endpoint on any host (Docker healthcheck uses localhost)", () => {
    expect(proxy(requestFor("localhost:3000", "/api/health")).status).toBe(200);
  });

  it("does not extend that exception to other paths or lookalike paths", () => {
    expect(proxy(requestFor("localhost:3000", "/api/ready")).status).toBe(404);
    expect(proxy(requestFor("localhost:3000", "/api/health/extra")).status).toBe(404);
    expect(proxy(requestFor("localhost:3000", "/")).status).toBe(404);
  });
});
