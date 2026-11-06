// Bundles the Node entry points that run outside Next.js into `dist/` (Task 1.1, decision D4):
// the worker container's process and the Docker healthcheck. Each output is one self-contained
// CommonJS file, so the image needs no TypeScript runtime and no extra node_modules for them.
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

await build({
  absWorkingDir: fileURLToPath(new URL("..", import.meta.url)),
  entryPoints: {
    worker: "src/jobs/worker.ts",
    healthcheck: "src/healthcheck.ts",
  },
  outdir: "dist",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  target: "node24",
  // CommonJS: pino and its dependencies call require() on Node built-ins, which an ESM bundle cannot do.
  format: "cjs",
  // Stack traces point at the TypeScript sources (the image runs node with --enable-source-maps).
  sourcemap: true,
  logLevel: "info",
});
