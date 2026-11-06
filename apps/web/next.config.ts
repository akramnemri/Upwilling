import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are shipped as TypeScript source and compiled by Next.js.
  transpilePackages: ["@upwilling/design-system"],
  poweredByHeader: false,
  reactStrictMode: true,
  // Self-contained server (`.next/standalone`) for the Docker image: no `pnpm install` at runtime.
  output: "standalone",
  // Trace from the monorepo root so workspace packages and pnpm's hoisted store are copied too.
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
};

export default nextConfig;
