import { fileURLToPath } from "node:url";

import { withPayload } from "@payloadcms/next/withPayload";
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
  experimental: {
    // Two root layouts since Task 3.1 (public sites and Payload's admin): unmatched URLs need one
    // 404 page of their own (src/app/global-not-found.tsx).
    globalNotFound: true,
  },
};

// Payload's Next.js integration (Task 3.1). `devBundleServerPackages: false` as in Payload's template:
// faster `next dev`, no effect on production builds.
export default withPayload(nextConfig, { devBundleServerPackages: false });
