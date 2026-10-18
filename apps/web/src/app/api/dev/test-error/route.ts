import { getEnv } from "../../../../lib/env";
import { AppError } from "../../../../lib/errors";
import { withErrorHandling } from "../../../../lib/http/route-handler";

/**
 * Local-only route to see error handling end to end (Task 0.4 manual test).
 * `?kind=expected` throws an AppError; anything else throws an unexpected error whose message
 * contains fake secrets, which must never reach the response.
 */
export const GET = withErrorHandling("dev.testError", (request) => {
  if (getEnv().DEPLOY_ENV !== "local") {
    throw new AppError("NOT_FOUND", "Ressource introuvable.", { status: 404 });
  }

  const kind = new URL(request.url).searchParams.get("kind");
  if (kind === "expected") {
    throw new AppError("DEV_TEST_ERROR", "Erreur de test volontaire (attendue).", {
      status: 503,
      context: { reason: "deliberate test" },
    });
  }
  throw new Error("Deliberate unexpected test error: password=hunter2 token=fake-token-123");
});
