import { z } from "zod";

import { TENANT_SLUGS } from "../modules/core";

/**
 * Server environment, validated once at startup (instrumentation.ts) so a misconfigured container
 * fails immediately instead of on the first request that needs a value.
 *
 * Every variable added here must also be documented in `.env.example`.
 * Never read `process.env` elsewhere in server code: use `getEnv()`.
 */
const R2_VARIABLES = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BUCKET",
] as const;

const envSchema = z
  .object({
    DEPLOY_ENV: z.enum(["local", "recette", "production"]),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug"]).default("info"),
    // Container role (01_ARCHITECTURE.md §5.3). Unset means "serve every role", allowed only locally.
    // `migrate` is the one-off container the deploy agent runs before switching releases (Task 3.1b).
    APP_ROLE: z.enum(["web", "cms", "worker", "migrate"]).optional(),
    // The one site a `web` container serves.
    SITE: z.enum(TENANT_SLUGS).optional(),
    // Commit the image was built from, baked in by the publish workflow (Task 1.5). Never set by hand.
    APP_VERSION: z
      .string()
      .regex(/^([0-9a-f]{40}|local)$/, "must be a full commit SHA or local")
      .default("local"),
    // Payload (Task 3.1). Required by the cms and migrate roles (Task 3.1b). Locally optional: Payload itself
    // refuses to start without them (src/lib/payload-settings.ts), while public pages keep working.
    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, "must be a postgres:// connection URL")
      .optional(),
    // Signs Payload's login tokens. Generated per environment, never shared between environments.
    PAYLOAD_SECRET: z.string().min(32, "must be at least 32 characters").optional(),
    // Folder for uploaded media when R2 is not configured (ADR-008 update, Task 3.1).
    MEDIA_DIR: z.string().optional(),
    // Cloudflare R2 (ADR-008): all four or none. None means media stay in MEDIA_DIR.
    R2_ENDPOINT: z.url({ protocol: /^https$/ }).optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_PUBLIC_BUCKET: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    // A deployed container without a role would serve every host: the opposite of fault isolation.
    if (env.APP_ROLE === undefined && env.DEPLOY_ENV !== "local") {
      ctx.addIssue({
        code: "custom",
        path: ["APP_ROLE"],
        message: "is missing (required when DEPLOY_ENV is recette or production)",
      });
    }
    if (env.APP_ROLE === "web" && env.SITE === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["SITE"],
        message: "is missing (required when APP_ROLE is web)",
      });
    }
    if (env.APP_ROLE !== "web" && env.SITE !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["SITE"],
        message: "is invalid: only allowed when APP_ROLE is web",
      });
    }
    if (env.APP_ROLE === "cms" || env.APP_ROLE === "migrate") {
      for (const variable of ["DATABASE_URL", "PAYLOAD_SECRET"] as const) {
        if (env[variable] === undefined) {
          ctx.addIssue({
            code: "custom",
            path: [variable],
            message: `is missing (required when APP_ROLE is ${env.APP_ROLE})`,
          });
        }
      }
    }
    // ADR-008: production media live on R2. A production cms without it would write uploads into its own
    // container, where a redeploy loses them.
    if (
      env.DEPLOY_ENV === "production" &&
      env.APP_ROLE === "cms" &&
      env.R2_ENDPOINT === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["R2_ENDPOINT"],
        message: "is missing (production media must be on R2, ADR-008)",
      });
    }
    const r2Variables = R2_VARIABLES.filter((variable) => env[variable] !== undefined);
    if (r2Variables.length > 0 && r2Variables.length < R2_VARIABLES.length) {
      for (const variable of R2_VARIABLES.filter((name) => env[name] === undefined)) {
        ctx.addIssue({
          code: "custom",
          path: [variable],
          message: "is missing (the R2 variables are set together or not at all)",
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;
export type DeployEnv = Env["DEPLOY_ENV"];
export type LogLevel = Env["LOG_LEVEL"];

export class EnvValidationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      [
        "Invalid environment configuration:",
        ...problems.map((problem) => `  - ${problem}`),
        "See .env.example for the expected variables.",
      ].join("\n"),
    );
    this.name = "EnvValidationError";
  }
}

/** Validates a raw environment. Error messages name variables but never echo their values (they may be secrets). */
export function parseEnv(rawSource: Readonly<Record<string, string | undefined>>): Env {
  // An empty value (`LOG_LEVEL=` in a .env file) means "not set", so defaults and "missing" messages apply.
  const source = Object.fromEntries(
    Object.entries(rawSource).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }

  const problems = result.error.issues.map((issue) => {
    const variable = issue.path.join(".") || "(root)";
    if (issue.code === "custom") {
      // Cross-variable rules carry their own complete wording.
      return `${variable} ${issue.message}`;
    }
    return source[variable] === undefined
      ? `${variable} is missing`
      : `${variable} is invalid: ${describeIssue(issue)}`;
  });
  throw new EnvValidationError(problems);
}

function describeIssue(issue: z.core.$ZodIssue): string {
  if (issue.code === "invalid_value") {
    return `expected one of ${issue.values.map((value) => JSON.stringify(value)).join(", ")}`;
  }
  return issue.message;
}

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
