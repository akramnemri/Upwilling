export const E2E_PORT = 3100;

/**
 * Builds a URL on one of the local hosts. Chromium resolves every `*.localhost` name to the loopback
 * address by itself, so the browser sends the real `Host` header without any hosts-file entry.
 */
export function localUrl(host: string, path = "/"): string {
  return `http://${host}:${E2E_PORT}${path}`;
}
