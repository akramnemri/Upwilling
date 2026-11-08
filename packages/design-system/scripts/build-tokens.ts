// Regenerates css/tokens.css and src/generated/tokens.ts from tokens/**.json.
// Run with `pnpm --filter @upwilling/design-system tokens` after editing a token file, and commit the
// result: a unit test fails while the generated files are out of date.
// Node runs this TypeScript file directly (type stripping), so imports carry the `.ts` extension.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readTokenSources } from "../src/tokens/read-sources.ts";
import { buildTokenFiles } from "../src/tokens/render.ts";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

const files = buildTokenFiles(readTokenSources(join(packageRoot, "tokens")));
for (const { path, content } of files) {
  writeFileSync(join(packageRoot, path), content);
  process.stdout.write(`wrote ${path}\n`);
}
