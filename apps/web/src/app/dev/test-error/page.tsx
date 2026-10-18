import { notFound } from "next/navigation";

import { getEnv } from "../../../lib/env";

// Rendered per request: at build time there is no DEPLOY_ENV, and the build must not throw.
export const dynamic = "force-dynamic";

// Local-only page that fails while rendering, to see error.tsx and the server log (Task 0.4 manual test).
export default function TestErrorPage(): never {
  if (getEnv().DEPLOY_ENV !== "local") {
    notFound();
  }
  throw new Error("Deliberate page render test error: secret=fake-secret-456");
}
