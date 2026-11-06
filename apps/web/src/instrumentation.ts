import type { Instrumentation } from "next";

// Runs once when a Next.js server instance starts, before it accepts requests.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runStartupChecks } = await import("./instrumentation.node");
    runStartupChecks();
  }
}

// Called by Next.js for every error thrown while rendering, in route handlers, server actions or the proxy.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportRequestError } = await import("./instrumentation.node");
    reportRequestError(error, request, context);
  }
};
