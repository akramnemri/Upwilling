import { z } from "zod";

/**
 * Server environment, validated once at startup (instrumentation.ts) so a misconfigured container
 * fails immediately instead of on the first request that needs a value.
 *
 * Every variable added here must also be documented in `.env.example`.
 * Never read `process.env` elsewhere in server code: use `getEnv()`.
 */
const envSchema = z.object({
  DEPLOY_ENV: z.enum(["local", "recette", "production"]),
});

export type Env = z.infer<typeof envSchema>;
export type DeployEnv = Env["DEPLOY_ENV"];

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
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }

  const problems = result.error.issues.map((issue) => {
    const variable = issue.path.join(".") || "(root)";
    return source[variable] === undefined || source[variable] === ""
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
