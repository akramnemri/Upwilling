import { NextResponse, type NextRequest } from "next/server";

import { getEnv } from "./lib/env";
import { newRequestId, REQUEST_ID_HEADER } from "./lib/request-id";
import { isIndexable, NO_INDEX_VALUE, X_ROBOTS_TAG_HEADER } from "./modules/content";
import { resolveHost, resolveRoute, roleFromEnv } from "./modules/core";

/**
 * Runs before every route:
 * 1. assigns a fresh request ID (a client-sent `x-request-id` is overwritten: it is client-controlled);
 * 2. answers 404 for anything this container must not serve: unknown hosts, hosts of another role or
 *    site, and paths that do not exist on that kind of host (core `resolveRoute`, 01_ARCHITECTURE.md §5.3).
 *    Only the `Host` header is used: `X-Forwarded-Host` is client-controlled unless a trusted proxy sets
 *    it, and Caddy forwards the original Host;
 * 3. adds `X-Robots-Tag: noindex, nofollow` to every response that must not be indexed (content `isIndexable`).
 */
export function proxy(request: NextRequest): NextResponse {
  const requestId = newRequestId();

  const env = getEnv();
  const rawHost = request.headers.get("host");
  const robotsHeaders: Record<string, string> = isIndexable(
    resolveHost(rawHost, env.DEPLOY_ENV),
    env.DEPLOY_ENV,
  )
    ? {}
    : { [X_ROBOTS_TAG_HEADER]: NO_INDEX_VALUE };

  const decision = resolveRoute({
    role: roleFromEnv(env),
    rawHost,
    pathname: request.nextUrl.pathname,
    deployEnv: env.DEPLOY_ENV,
  });
  if (decision === "not_found") {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        [REQUEST_ID_HEADER]: requestId,
        ...robotsHeaders,
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  for (const [name, value] of Object.entries(robotsHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  // Next.js build assets are host-independent; everything else goes through the proxy.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
