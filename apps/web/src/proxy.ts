import { NextResponse, type NextRequest } from "next/server";

import { getEnv } from "./lib/env";
import { resolveHost } from "./modules/core";

/**
 * Refuses every request whose host is not in the allowlist, before any route renders.
 * Uses the `Host` header only: `X-Forwarded-Host` is client-controlled unless a trusted proxy
 * sets it, and Caddy forwards the original Host (01_ARCHITECTURE.md §5).
 */
export function proxy(request: NextRequest): NextResponse {
  const target = resolveHost(request.headers.get("host"), getEnv().DEPLOY_ENV);
  if (target === null) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.next();
}

export const config = {
  // Next.js build assets are host-independent; everything else goes through the host check.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
