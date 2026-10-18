import { scrubSensitiveText } from "./redaction";

/**
 * Stable error codes. Clients and logs rely on them: never rename a code, add a new one instead.
 */
export type AppErrorCode =
  "BAD_REQUEST" | "NOT_FOUND" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR" | "DEV_TEST_ERROR";

export interface AppErrorOptions {
  /** HTTP status sent to the client. Defaults to 500. */
  status?: number;
  /** Internal details for logs only. Never sent to the client; never put personal data here. */
  context?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}

/**
 * An expected failure with a stable code and a message that is safe to show to the user (French).
 * Anything that is not an AppError is treated as unexpected and hidden behind a generic message.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly context: Readonly<Record<string, unknown>>;

  constructor(code: AppErrorCode, userMessage: string, options: AppErrorOptions = {}) {
    super(userMessage, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = options.status ?? 500;
    this.context = options.context ?? {};
  }
}

export const GENERIC_ERROR_MESSAGE =
  "Une erreur inattendue est survenue. Merci de réessayer dans quelques instants.";

/** JSON body of every error returned by a route handler. */
export interface ErrorResponseBody {
  error: {
    code: AppErrorCode;
    message: string;
    requestId: string;
  };
}

export function toErrorResponse(
  error: unknown,
  requestId: string,
): { status: number; body: ErrorResponseBody } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message, requestId } },
    };
  }
  // Unexpected errors may carry internals (SQL, file paths, tokens): only the generic message leaves the server.
  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: GENERIC_ERROR_MESSAGE, requestId } },
  };
}

export interface NormalizedError {
  name: string;
  message: string;
  code?: AppErrorCode;
  status?: number;
  context?: Readonly<Record<string, unknown>>;
  stack?: string;
  cause?: NormalizedError;
}

const MAX_CAUSE_DEPTH = 3;

/**
 * Turns any thrown value into a plain object for structured logs (Error objects do not serialize to JSON).
 * Messages and stacks are scrubbed: third-party errors sometimes embed credentials or emails.
 */
export function normalizeError(error: unknown, depth = 0): NormalizedError {
  if (!(error instanceof Error)) {
    return { name: "NonErrorThrown", message: scrubSensitiveText(describeNonError(error)) };
  }

  const normalized: NormalizedError = {
    name: error.name,
    message: scrubSensitiveText(error.message),
  };
  if (error.stack !== undefined) {
    normalized.stack = scrubSensitiveText(error.stack);
  }
  if (error instanceof AppError) {
    normalized.code = error.code;
    normalized.status = error.status;
    normalized.context = error.context;
  }
  if (error.cause !== undefined && depth < MAX_CAUSE_DEPTH) {
    normalized.cause = normalizeError(error.cause, depth + 1);
  }
  return normalized;
}

function describeNonError(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  return `Thrown value of type ${typeof value}`;
}
