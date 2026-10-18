import { NextResponse, type NextRequest } from "next/server";

import { getEnv } from "./lib/env";
import { newRequestId, REQUEST_ID_HEADER } from "./lib/request-id";
import { resolveHost } from "./modules/core";

// Liveness is checked by Docker from inside the container (Host: localhost), so it bypasses the host
// allowlist. It returns a constant and reads no data, so exposing it on every host leaks nothing.
const HOST_INDEPENDENT_PATHS = new Set(["/api/health"]);

/**
 * Runs before every route:
 * 1. assigns a fresh request ID (a client-sent `x-request-id` is overwritten: it is client-controlled);
 * 2. refuses hosts that are not in the allowlist. Only the `Host` header is used: `X-Forwarded-Host`
 *    is client-controlled unless a trusted proxy sets it, and Caddy forwards the original Host.
 */
export function proxy(request: NextRequest): NextResponse {
  const requestId = newRequestId();

  const isHostIndependent = HOST_INDEPENDENT_PATHS.has(request.nextUrl.pathname);
  if (!isHostIndependent) {
    const target = resolveHost(request.headers.get("host"), getEnv().DEPLOY_ENV);
    if (target === null) {
      return new NextResponse("Not Found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", [REQUEST_ID_HEADER]: requestId },
      });
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  // Next.js build assets are host-independent; everything else goes through the proxy.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
