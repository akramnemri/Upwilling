// Bundles the Node entry points that run outside Next.js into `dist/` (Task 1.1, decision D4):
// the worker container's process, the Docker healthcheck and the migration container (Task 3.1b).
// The image needs no TypeScript runtime for them.
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const common = {
  absWorkingDir: fileURLToPath(new URL("..", import.meta.url)),
  outdir: "dist",
  bundle: true,
  platform: "node",
  target: "node24",
  // Stack traces point at the TypeScript sources (the image runs node with --enable-source-maps).
  sourcemap: true,
  logLevel: "info",
};

// Self-contained CommonJS files: pino and its dependencies call require() on Node built-ins, which an
// ESM bundle cannot do.
await build({
  ...common,
  entryPoints: {
    worker: "src/jobs/worker.ts",
    healthcheck: "src/healthcheck.ts",
  },
  outExtension: { ".js": ".cjs" },
  format: "cjs",
});

// The migration container: Payload, the Postgres adapter and our configuration in one ESM file. Next.js
// bundles Payload into its own server chunks, so the standalone node_modules cannot serve these imports.
// ESM because Payload uses top-level await; the banner gives the CommonJS packages inside it a require().
await build({
  ...common,
  entryPoints: { migrate: "src/jobs/migrate.ts" },
  outExtension: { ".js": ".mjs" },
  format: "esm",
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
  // Migrations never resize images, and sharp is native: a stand-in that throws if called.
  alias: { sharp: "./src/jobs/sharp-unavailable.ts" },
  // Development-only code paths of the Postgres adapter (schema push, migration generation): never reached here.
  external: ["drizzle-kit", "drizzle-kit/*", "esbuild", "pg-native"],
  // Admin styles imported by editor packages: irrelevant on the server.
  loader: { ".css": "empty", ".scss": "empty" },
});
