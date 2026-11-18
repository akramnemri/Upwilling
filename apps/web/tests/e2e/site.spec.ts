import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Site header, footer and page layout (Task 2.4b) on /dev/site: both sites, phone and desktop
// widths, keyboard only for the menu, anchors kept clear of the sticky header.

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

const SITES = [
  {
    host: "upwilling.localhost",
    home: "UpWilling, accueil",
    first: "Formations",
    cta: "Demander un devis",
  },
  {
    host: "careerboost.localhost",
    home: "UpWilling Career Boost, accueil",
    first: "L’association",
    cta: "Adhérer",
  },
] as const;

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

for (const site of SITES) {
  test.describe(site.host, () => {
    test("desktop: header row with links and call to action, footer with the legal placeholder", async ({
      page,
    }) => {
      await page.setViewportSize(DESKTOP);
      const response = await page.goto(localUrl(site.host, "/dev/site"));
      expect(response?.status()).toBe(200);

      const nav = page.getByRole("navigation", { name: "Navigation principale" });
      await expect(page.getByRole("link", { name: site.home })).toBeVisible();
      await expect(nav.getByRole("link", { name: site.first })).toBeVisible();
      await expect(nav.getByRole("button", { name: "Menu" })).toBeHidden();
      await expect(page.getByRole("banner").getByRole("link", { name: site.cta })).toBeVisible();

      const footer = page.getByRole("contentinfo");
      await expect(footer.getByText("[À compléter par le PO]")).toBeVisible();
      await expect(
        footer.getByRole("navigation", { name: "Informations légales" }).getByRole("link"),
      ).toHaveCount(3);
      await expectNoAxeViolations(page);
    });

    test("mobile: the menu works with the keyboard alone", async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(localUrl(site.host, "/dev/site"));
      const nav = page.getByRole("navigation", { name: "Navigation principale" });
      const button = nav.getByRole("button", { name: "Menu" });
      const firstLink = nav.getByRole("link", { name: site.first });
      await expect(firstLink).toBeHidden();

      // Skip link first, then the logo, then the menu button.
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
      await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: site.home })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(button).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(firstLink).toBeVisible();
      await expectNoAxeViolations(page);
      await page.keyboard.press("Tab");
      await expect(firstLink).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(button).toBeFocused();
      await expect(firstLink).toBeHidden();
      // No horizontal scrolling at phone width.
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(MOBILE.width);
    });

    test("mobile: choosing an anchor closes the menu and keeps its title clear of the header", async ({
      page,
    }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(localUrl(site.host, "/dev/site"));
      const nav = page.getByRole("navigation", { name: "Navigation principale" });
      await nav.getByRole("button", { name: "Menu" }).click();
      await nav.getByRole("link", { name: site.first }).click();

      await expect(nav.getByRole("button", { name: "Menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(page).toHaveURL(/#/);
      const heading = page.getByRole("main").getByRole("heading", { level: 2, name: site.first });
      await expect(heading).toBeInViewport();
      const headerBottom = (await page.getByRole("banner").boundingBox())?.y ?? 0;
      const headerHeight = (await page.getByRole("banner").boundingBox())?.height ?? 0;
      const headingTop = (await heading.boundingBox())?.y ?? 0;
      expect(headingTop).toBeGreaterThanOrEqual(headerBottom + headerHeight);
    });
  });
}
