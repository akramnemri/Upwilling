import { normalizeError, toErrorResponse } from "../errors";
import { getLogger } from "../logger";
import { REQUEST_ID_HEADER, requestIdFrom } from "../request-id";

export const NO_STORE = { "cache-control": "no-store" } as const;

type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Wraps a route handler so every failure becomes the standard JSON error body
 * (`{ error: { code, message, requestId } }`) and is logged once with its request ID.
 */
export function withErrorHandling(operation: string, handler: RouteHandler): RouteHandler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      const requestId = requestIdFrom(request.headers);
      const { status, body } = toErrorResponse(error, requestId);
      const log = getLogger().child({ requestId, operation });
      if (status >= 500) {
        log.error({ err: normalizeError(error), status }, "route handler failed");
      } else {
        log.warn({ err: normalizeError(error), status }, "route handler refused the request");
      }
      return Response.json(body, {
        status,
        headers: { ...NO_STORE, [REQUEST_ID_HEADER]: requestId },
      });
    }
  };
}
