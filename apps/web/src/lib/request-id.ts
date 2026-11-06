/** Set by proxy.ts on every request. Any value sent by the client is overwritten there. */
export const REQUEST_ID_HEADER = "x-request-id";

const UNKNOWN_REQUEST_ID = "unknown";

export function newRequestId(): string {
  return crypto.randomUUID();
}

export function requestIdFrom(requestHeaders: Pick<Headers, "get">): string {
  return requestHeaders.get(REQUEST_ID_HEADER) ?? UNKNOWN_REQUEST_ID;
}
