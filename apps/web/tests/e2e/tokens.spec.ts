import { expect, type Page, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Token stylesheet and preview page (Task 2.1a): each host gets its brand's variables from tokens.css.

async function cssVariable(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (variable) =>
      getComputedStyle(document.documentElement).getPropertyValue(variable).trim().toUpperCase(),
    name,
  );
}

const HOSTS = [
  { host: "upwilling.localhost", brand: "upwilling" },
  { host: "careerboost.localhost", brand: "careerboost" },
] as const;

for (const { host, brand } of HOSTS) {
  test(`${host}/dev/tokens previews the ${brand} tokens the stylesheet applies`, async ({
    page,
  }) => {
    const response = await page.goto(localUrl(host, "/dev/tokens"));

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aperçu des jetons de design");
    await expect(page.getByTestId("brand")).toHaveText(brand);
    // The value printed from the TypeScript tokens is the one the browser got from tokens.css.
    const primary = await cssVariable(page, "--uw-color-primary");
    expect(primary).toMatch(/^#[0-9A-F]{6}$/);
    await expect(page.getByTestId("role-primary")).toHaveText(primary);
    await expect(page.getByText("✘ insuffisant")).toHaveCount(0);
    // Tailwind's bg-primary (Task 2.1b) reads the same brand variable.
    await expect(page.getByTestId("tailwind-primary")).toHaveCSS(
      "background-color",
      hexToRgb(primary),
    );
  });
}

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

test("the two sites share the accent and differ in primary color", async ({ page }) => {
  await page.goto(localUrl("upwilling.localhost"));
  const academy = {
    primary: await cssVariable(page, "--uw-color-primary"),
    accent: await cssVariable(page, "--uw-color-accent"),
    space: await cssVariable(page, "--uw-space-4"),
  };
  await page.goto(localUrl("careerboost.localhost"));
  const association = {
    primary: await cssVariable(page, "--uw-color-primary"),
    accent: await cssVariable(page, "--uw-color-accent"),
    space: await cssVariable(page, "--uw-space-4"),
  };

  expect(academy.primary).toMatch(/^#[0-9A-F]{6}$/);
  expect(association.primary).not.toBe(academy.primary);
  expect(association.accent).toBe(academy.accent);
  expect(association.space).toBe(academy.space);
});
