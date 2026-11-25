import path from "node:path";

import { EnvValidationError, getEnv } from "./env";

/** Cloudflare R2 bucket for public media (ADR-008). */
export type R2Settings = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBucket: string;
};

export type PayloadSettings = {
  databaseUrl: string;
  secret: string;
  /** Where uploads are written when R2 is not configured. */
  mediaDir: string;
  /** Undefined until the Cloudflare account exists: media then stay in `mediaDir`. */
  r2: R2Settings | undefined;
};

// Default local upload folder: apps/web/media (gitignored). Resolved from the working directory, which is
// apps/web for `pnpm dev`, the Payload CLI and the tests.
const DEFAULT_MEDIA_DIR = "media";

// `next build` imports every route module, so payload.config.ts is evaluated at build time too, where no
// runtime environment exists (the Docker build has none on purpose). Building never opens a database
// connection, so placeholders are safe there; at runtime the real values are validated below.
const NEXT_BUILD_PHASE = "phase-production-build";

/**
 * Payload's configuration values, validated. Throws an EnvValidationError naming every missing variable,
 * so a local run without a database fails with a clear message instead of a connection error.
 */
export function getPayloadSettings(): PayloadSettings {
  // NEXT_PHASE is set by Next.js itself, not by us: the one other process.env read in server code.
  if (process.env.NEXT_PHASE === NEXT_BUILD_PHASE) {
    return {
      databaseUrl: "postgres://build-placeholder",
      secret: "build-placeholder",
      mediaDir: DEFAULT_MEDIA_DIR,
      r2: undefined,
    };
  }

  const env = getEnv();
  const missing = (["DATABASE_URL", "PAYLOAD_SECRET"] as const).filter(
    (variable) => env[variable] === undefined,
  );
  if (env.DATABASE_URL === undefined || env.PAYLOAD_SECRET === undefined) {
    throw new EnvValidationError(
      missing.map((variable) => `${variable} is missing (Payload needs it)`),
    );
  }

  return {
    databaseUrl: env.DATABASE_URL,
    secret: env.PAYLOAD_SECRET,
    mediaDir: path.resolve(env.MEDIA_DIR ?? DEFAULT_MEDIA_DIR),
    // parseEnv guarantees the four R2 variables are all set or all unset.
    r2:
      env.R2_ENDPOINT !== undefined &&
      env.R2_ACCESS_KEY_ID !== undefined &&
      env.R2_SECRET_ACCESS_KEY !== undefined &&
      env.R2_PUBLIC_BUCKET !== undefined
        ? {
            endpoint: env.R2_ENDPOINT,
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            publicBucket: env.R2_PUBLIC_BUCKET,
          }
        : undefined,
  };
}
