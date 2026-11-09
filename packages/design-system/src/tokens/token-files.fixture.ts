import { fileURLToPath } from "node:url";

import { readTokenFiles } from "./read-sources.ts";

// Test helpers: the real token files, read fresh on every call so a test can change its copy.

export const PACKAGE_ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const TOKENS_ROOT = fileURLToPath(new URL("../../tokens", import.meta.url));

export function realTokenFiles(): Map<string, unknown> {
  return readTokenFiles(TOKENS_ROOT);
}

/** Sets `value` at `keys` inside one parsed file (the last key is created if missing). */
export function setInFile(
  files: Map<string, unknown>,
  path: string,
  keys: readonly string[],
  value: unknown,
): Map<string, unknown> {
  const parents = keys.slice(0, -1);
  const last = keys.at(-1);
  if (last === undefined) {
    throw new Error("setInFile needs at least one key");
  }
  let node = asObject(files.get(path), path);
  for (const key of parents) {
    node = asObject(node[key], `${path} ${key}`);
  }
  node[last] = value;
  return files;
}

function asObject(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${where} is not an object in the token files`);
  }
  return value as Record<string, unknown>;
}
