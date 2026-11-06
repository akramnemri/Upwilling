import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Branded "under construction" pages (Task 1.2, TR-13): each host shows its own brand, never the other one.
const SITES = [
  {
    host: "upwilling.localhost",
    brand: "upwilling",
    title: "UpWilling — Centre de formation",
    siteName: "UpWilling",
    icon: "/brands/upwilling/icon.svg",
    otherBrandText: "Career Boost",
  },
  {
    host: "careerboost.localhost",
    brand: "careerboost",
    title: "UpWilling Career Boost — Association",
    siteName: "UpWilling Career Boost",
    icon: "/brands/careerboost/icon.png",
    otherBrandText: "Centre de formation",
  },
] as const;

for (const site of SITES) {
  test(`${site.host} shows the ${site.brand} brand with French copy and metadata`, async ({
    page,
  }) => {
    const response = await page.goto(localUrl(site.host));

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(site.title);
    await expect(page.locator("html")).toHaveAttribute("data-brand", site.brand);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByText("Site en construction")).toBeVisible();
    await expect(page.getByText("Apprendre. Évoluer. Réussir.")).toBeVisible();
    await expect(page.getByText("Adresse de contact bientôt disponible.")).toBeVisible();
    await expect(page.getByText(site.otherBrandText)).toHaveCount(0);

    // Metadata may be streamed at the end of <body> (Next.js 16): look in the whole document.
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      site.siteName,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "fr_FR");
    await expect(page.locator(`link[rel="icon"][href="${site.icon}"]`)).toHaveCount(1);
  });

  test(`${site.host} is never indexable outside production`, async ({ page }) => {
    const response = await page.goto(localUrl(site.host));

    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  });

  test(`${site.host} fits a 375 px wide phone without horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(localUrl(site.host));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("careerboost.localhost shows its logo, loaded and described", async ({ page }) => {
  await page.goto(localUrl("careerboost.localhost"));

  const logo = page.getByRole("img", { name: "UpWilling Career Boost" });
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test("upwilling.localhost shows a text wordmark until the academy logo arrives", async ({
  page,
}) => {
  await page.goto(localUrl("upwilling.localhost"));

  await expect(page.getByText("UpWilling", { exact: true })).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(0);
});
