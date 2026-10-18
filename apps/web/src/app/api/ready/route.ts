import { getEnv } from "../../../lib/env";
import { NO_STORE } from "../../../lib/http/route-handler";

type CheckResult = "ok" | "failed" | "not_configured";

/**
 * Readiness: "this instance can serve real traffic". Used by deploy smoke tests and the uptime monitor.
 * Failure details stay in the logs; the response only names which check failed.
 */
export function GET(): Response {
  const checks: Record<string, CheckResult> = {
    config: checkConfig(),
    // The database is a placeholder (ADR-005): this check becomes real when it is provided.
    database: "not_configured",
  };
  const ready = !Object.values(checks).includes("failed");

  return Response.json(
    { status: ready ? "ready" : "not_ready", checks },
    { status: ready ? 200 : 503, headers: NO_STORE },
  );
}

function checkConfig(): CheckResult {
  try {
    getEnv();
    return "ok";
  } catch {
    // Startup already exits on invalid config (instrumentation.node.ts); reaching this means the
    // environment changed under a running process, which the startup log explains.
    return "failed";
  }
}
