import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

// Storybook of the design system (Task 2.3a). The Next.js framework for Vite, so `next/link` and
// `next/image` behave as in the application; Tailwind through its Vite plugin, reading this package's
// own entry (css/tailwind.css, imported by preview.tsx).
const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../react/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  core: {
    disableTelemetry: true,
  },
  viteFinal(viteConfig) {
    return {
      ...viteConfig,
      plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
    };
  },
};

export default config;
