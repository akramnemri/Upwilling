import { getEnv } from "../../../lib/env";
import { NO_STORE } from "../../../lib/http/route-handler";

/**
 * The commit this container runs (Task 1.5). Deploy workflows poll it to know when a new version is live.
 * The repository is public, so the SHA reveals nothing; "local" means a build that was not published.
 */
export function GET(): Response {
  return Response.json({ version: getEnv().APP_VERSION }, { headers: NO_STORE });
}
