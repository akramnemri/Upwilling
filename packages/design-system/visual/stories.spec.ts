import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

// One screenshot test per Storybook story, run once per brand project (playwright.config.ts). The
// list comes from the built Storybook's index, so a new story gets a test without touching this
// file; its baseline comes from the CI artifact (README: "Visual regression").

interface IndexEntry {
  readonly type: "story" | "docs";
  readonly id: string;
  readonly tags?: readonly string[];
}

/** Stories whose look depends on timing (e.g. a 3-second pending state) carry this tag. */
const SKIP_TAG = "skip-visual";

const index = JSON.parse(
  readFileSync(join(import.meta.dirname, "../storybook-static/index.json"), "utf8"),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === "story" && !(entry.tags ?? []).includes(SKIP_TAG),
);

for (const story of stories) {
  test(story.id, async ({ page }, testInfo) => {
    const brand = String(testInfo.project.metadata["brand"]);
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=brand:${brand}`);
    // Rendered and its play function done (Storybook's own render phases), fonts loaded.
    await page.waitForFunction(() => {
      const phase = (
        window as unknown as {
          __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
        }
      ).__STORYBOOK_PREVIEW__?.currentRender?.phase;
      return phase === "completed" || phase === "finished";
    });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("html")).toHaveAttribute("data-brand", brand);
    await expect(page).toHaveScreenshot(`${story.id}.png`, { fullPage: true });
  });
}
