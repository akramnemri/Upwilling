import { checkDatabase } from "../../../lib/database-check";
import { getEnv } from "../../../lib/env";
import { NO_STORE } from "../../../lib/http/route-handler";

type CheckResult = "ok" | "failed" | "not_configured";

/**
 * Readiness: "this instance can serve real traffic". Used by deploy smoke tests and the uptime monitor.
 * Failure details stay in the logs; the response only names which check failed.
 */
export async function GET(): Promise<Response> {
  const checks: Record<string, CheckResult> = {
    config: checkConfig(),
    // Real where the container uses the database (cms, Task 3.1b); "not_configured" elsewhere.
    database: await checkDatabase(),
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
