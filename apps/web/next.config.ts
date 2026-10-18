import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are shipped as TypeScript source and compiled by Next.js.
  transpilePackages: ["@upwilling/design-system"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
