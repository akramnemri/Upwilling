import type { Instrumentation } from "next";

import { installConsoleScrubbing } from "./lib/console-scrubbing";
import { EnvValidationError, getEnv } from "./lib/env";
import { normalizeError } from "./lib/errors";
import { getLogger } from "./lib/logger";
import { REQUEST_ID_HEADER } from "./lib/request-id";

/**
 * Node.js-only startup checks. On invalid configuration we exit instead of throwing: Next.js only logs a
 * failed instrumentation hook and keeps the server listening, which would leave a container that looks
 * alive (Docker healthcheck green) but cannot serve a single request.
 */
export function runStartupChecks(): void {
  installConsoleScrubbing();
  try {
    getEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // The logger itself depends on a valid environment, so this one message goes straight to stderr.
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

type RequestErrorArgs = Parameters<Instrumentation.onRequestError>;

/** Logs a server-side request error with its request ID; the user only sees the error page and digest. */
export function reportRequestError(
  error: RequestErrorArgs[0],
  request: RequestErrorArgs[1],
  context: RequestErrorArgs[2],
): void {
  const requestIdHeader = request.headers[REQUEST_ID_HEADER];
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  getLogger().error(
    {
      requestId: typeof requestIdHeader === "string" ? requestIdHeader : "unknown",
      operation: "next.requestError",
      method: request.method,
      // The query string may contain tokens or personal data: only the path is logged.
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      digest,
      err: normalizeError(error),
    },
    "request failed",
  );
}
