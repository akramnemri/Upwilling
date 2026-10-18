export const REDACTED = "[REDACTED]";

// Free text (error messages, stacks, log messages) can carry secrets that key-based redaction never sees,
// e.g. a driver echoing its connection string. Best-effort patterns; structured fields remain the rule.
const TEXT_PATTERNS: readonly [RegExp, string][] = [
  // key=value or key: value for sensitive keys
  [
    /\b(password|passwd|pwd|token|secret|api[_-]?key|access[_-]?key|authorization|cookie)(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s,;&]+)/gi,
    `$1$2${REDACTED}`,
  ],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/g, `Bearer ${REDACTED}`],
  // Credentials inside URLs: scheme://user:password@host
  [/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/:@]+:[^\s/@]+@/gi, `$1${REDACTED}@`],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, REDACTED],
];

export function scrubSensitiveText(text: string): string {
  return TEXT_PATTERNS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}
