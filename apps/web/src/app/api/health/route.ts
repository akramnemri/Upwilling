import { NO_STORE } from "../../../lib/http/route-handler";

/**
 * Liveness: "the process is up and serving HTTP". Checks no dependency on purpose, so a database or
 * provider outage never makes Docker restart healthy containers in a loop (01_ARCHITECTURE.md §5.3).
 */
export function GET(): Response {
  return Response.json({ status: "ok" }, { headers: NO_STORE });
}
