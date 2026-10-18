// Runs once when a Next.js server instance starts, before it accepts requests.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runStartupChecks } = await import("./instrumentation.node");
    runStartupChecks();
  }
}
