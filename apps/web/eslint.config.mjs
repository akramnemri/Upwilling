import { nextConfig } from "@upwilling/config/eslint/next";

import designTokenRules from "./eslint.design-tokens.mjs";

const config = [...nextConfig, ...designTokenRules];

export default config;
