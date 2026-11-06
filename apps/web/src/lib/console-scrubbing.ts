import { inspect } from "node:util";

import { scrubSensitiveText } from "./redaction";

type ConsoleMethod = (...args: unknown[]) => void;

/**
 * Next.js prints its own render errors with `console.error` ("⨯ Error: …"), outside our logger, so
 * secrets inside an error message would reach the container logs unscrubbed. This routes console
 * output through the same scrubber. Our code still logs through `getLogger()`, never `console`.
 */
export function installConsoleScrubbing(target: Pick<Console, "error" | "warn"> = console): void {
  target.error = scrubbing(target.error.bind(target));
  target.warn = scrubbing(target.warn.bind(target));
}

function scrubbing(write: ConsoleMethod): ConsoleMethod {
  return (...args) => {
    write(...args.map(scrubArgument));
  };
}

function scrubArgument(arg: unknown): unknown {
  if (typeof arg === "string") {
    return scrubSensitiveText(arg);
  }
  if (typeof arg === "object" && arg !== null) {
    // Same rendering console would produce (stack, digest…), scrubbed.
    return scrubSensitiveText(inspect(arg, { depth: 4 }));
  }
  return arg;
}
