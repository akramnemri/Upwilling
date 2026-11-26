import { getEnv } from "./env";
import { normalizeError } from "./errors";
import { getLogger } from "./logger";

export type DatabaseCheck = "ok" | "failed" | "not_configured";

const DATABASE_CHECK_TIMEOUT_MS = 3000;

/**
 * Readiness of the database for this container (Task 3.1b). Only containers given DATABASE_URL use the
 * database (the cms role today); the others answer "not_configured" and never load Payload.
 *
 * The probe counts the users through Payload: it proves the connection, the credentials and that the
 * migrations ran (a missing table fails it), which a bare `select 1` would not.
 */
export async function checkDatabase(): Promise<DatabaseCheck> {
  if (getEnv().DATABASE_URL === undefined) {
    return "not_configured";
  }
  try {
    await withTimeout(probe(), DATABASE_CHECK_TIMEOUT_MS);
    return "ok";
  } catch (error) {
    // Details stay in the logs; /api/ready only says which check failed.
    getLogger().warn(
      { operation: "ready.database", err: normalizeError(error) },
      "database readiness check failed",
    );
    return "failed";
  }
}

async function probe(): Promise<void> {
  // Loaded on demand so containers without a database never evaluate the Payload configuration.
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  const payload = await getPayload({ config });
  // System check, no user involved: access control does not apply to a readiness probe.
  await payload.count({ collection: "users", overrideAccess: true });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
