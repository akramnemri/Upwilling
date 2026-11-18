import { defineConfig, devices } from "@playwright/test";

// Visual regression of the Storybook stories (Task 2.3b): one screenshot per story and per brand,
// compared with the baselines in visual/__screenshots__/. Fonts and antialiasing differ between
// systems, so screenshots are taken only in the pinned Playwright container (CI job `visual`, which
// sets UPWILLING_VISUAL=container). README: "Visual regression".

const PORT = 6106;
const BRANDS = ["upwilling", "careerboost"] as const;

if (process.env["UPWILLING_VISUAL"] !== "container") {
  throw new Error(
    "Visual tests run only in the pinned Playwright container (CI job `visual`): screenshots taken " +
      "elsewhere would not match the baselines. See packages/design-system/README.md.",
  );
}

export default defineConfig({
  testDir: "./visual",
  testMatch: "**/*.spec.ts",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "visual-report" }]],
  outputDir: "visual-results",
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css" },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    reducedMotion: "reduce",
  },
  projects: BRANDS.map((brand) => ({
    name: brand,
    use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    metadata: { brand },
  })),
  webServer: {
    command: `node visual/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
