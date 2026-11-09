import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parseTokenSources, type TokenSources } from "./sources.ts";

// Node only: used by the generator script and the tests, never by the application.

const SOURCE_FOLDERS = ["base", "brands", "semantic"] as const;

/** Every `*.json` under `tokensRoot` (the package's `tokens/` folder), parsed, by relative path. */
export function readTokenFiles(tokensRoot: string): Map<string, unknown> {
  const files = new Map<string, unknown>();
  for (const folder of SOURCE_FOLDERS) {
    for (const fileName of readdirSync(join(tokensRoot, folder))) {
      if (!fileName.endsWith(".json")) {
        continue;
      }
      const path = `${folder}/${fileName}`;
      try {
        files.set(path, JSON.parse(readFileSync(join(tokensRoot, folder, fileName), "utf8")));
      } catch (error) {
        throw new Error(`${path}: not valid JSON`, { cause: error });
      }
    }
  }
  return files;
}

/** Reads and validates the token sources. Throws a `TokenSourceError` naming the file and key. */
export function readTokenSources(tokensRoot: string): TokenSources {
  return parseTokenSources(readTokenFiles(tokensRoot));
}
