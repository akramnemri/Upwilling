import { headers } from "next/headers";

import { getLogger, type Logger } from "./logger";
import { requestIdFrom } from "./request-id";

/** Request ID of the current request, for Server Components and server actions. */
export async function getRequestId(): Promise<string> {
  return requestIdFrom(await headers());
}

/** Logger bound to the current request: every line carries `requestId` and `operation`. */
export async function getRequestLogger(operation: string): Promise<Logger> {
  return getLogger().child({ requestId: await getRequestId(), operation });
}
