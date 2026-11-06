import pino, { type DestinationStream, type Logger } from "pino";

import { getEnv, type LogLevel } from "./env";
import { REDACTED, scrubSensitiveText } from "./redaction";

export type { Logger } from "pino";
export { REDACTED } from "./redaction";

/**
 * Keys whose values never reach the logs, at the top level and up to two levels deep
 * (e.g. `password`, `user.email`, `request.headers.cookie`). 02_CODING_STANDARDS.md §10.
 */
const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "clientSecret",
  "authorization",
  "cookie",
  "set-cookie",
  "signature",
  "signedUrl",
  "email",
  "phone",
  "body",
] as const;

function pathsFor(key: string): string[] {
  // Keys like "set-cookie" need bracket notation in redaction paths.
  const isIdentifier = /^[A-Za-z_$][\w$]*$/.test(key);
  const top = isIdentifier ? key : `["${key}"]`;
  const nested = isIdentifier ? `.${key}` : `["${key}"]`;
  return [top, `*${nested}`, `*.*${nested}`];
}

export interface CreateLoggerOptions {
  level: LogLevel;
  /** Defaults to stdout. Tests pass an in-memory stream. */
  destination?: DestinationStream;
}

export function createLogger({ level, destination }: CreateLoggerOptions): Logger {
  const options: pino.LoggerOptions = {
    level,
    base: { service: "upwilling-web" },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      // "level":"info" instead of "level":30, so logs are readable in `docker logs`.
      level: (label) => ({ level: label }),
    },
    redact: { paths: SENSITIVE_KEYS.flatMap(pathsFor), censor: REDACTED },
    hooks: {
      // Free-text messages are scrubbed too: redaction paths only see object keys.
      logMethod(args, method) {
        for (let index = 0; index < args.length; index += 1) {
          const arg: unknown = args[index];
          if (typeof arg === "string") {
            args[index] = scrubSensitiveText(arg);
          }
        }
        method.apply(this, args);
      },
    },
  };
  return destination === undefined ? pino(options) : pino(options, destination);
}

let rootLogger: Logger | undefined;

/** The process-wide logger. Create children with `requestId`, `operation`, `tenant` or `jobId`. */
export function getLogger(): Logger {
  rootLogger ??= createLogger({ level: getEnv().LOG_LEVEL });
  return rootLogger;
}

/** Logger for a background job (the worker arrives in Task 1.1 / 3.5). */
export function getJobLogger(jobId: string, operation: string): Logger {
  return getLogger().child({ jobId, operation });
}
