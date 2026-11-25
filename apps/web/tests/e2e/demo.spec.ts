import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Demo home page per brand (Task 2.5c) on /dev/demo: the section patterns inside the site layout.
// Checks what the PO review relies on: one h1, every header link lands on a section, no
// accessibility violation (contrast included, in Chromium), no horizontal scroll on a phone.

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SITES = ["upwilling.localhost", "careerboost.localhost"] as const;

for (const host of SITES) {
  test.describe(host, () => {
    test("desktop: one h1, header anchors land on sections, no axe violation", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const response = await page.goto(localUrl(host, "/dev/demo"));
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const anchors = await page
        .getByRole("banner")
        .getByRole("link")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")).filter((href) => href?.startsWith("#")),
        );
      expect(anchors.length).toBeGreaterThanOrEqual(5);
      for (const href of new Set(anchors)) {
        await expect(page.getByRole("main").locator(`${href}`)).toHaveCount(1);
      }

      const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    });

    test("phone: no horizontal scroll", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(localUrl(host, "/dev/demo"));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
    });
  });
}
