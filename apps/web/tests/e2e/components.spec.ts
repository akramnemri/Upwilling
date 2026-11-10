import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Component preview (Task 2.2a): full axe check in a real browser (including color contrast, which the
// unit tests cannot measure in jsdom), keyboard focus ring, reduced motion. Both brands.

const HOSTS = ["upwilling.localhost", "careerboost.localhost"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const host of HOSTS) {
  test(`${host}/dev/components has no axe violations (WCAG 2.2 AA)`, async ({ page }) => {
    const response = await page.goto(localUrl(host, "/dev/components"));
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aperçu des composants");

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(violations.map(({ id, help, nodes }) => `${id}: ${help} × ${nodes.length}`)).toEqual([]);
  });
}

test("keyboard focus shows the focus ring; a mouse click does not", async ({ page }) => {
  await page.goto(localUrl("upwilling.localhost", "/dev/components"));
  const ringColor = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--uw-color-focus-ring)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

  // Start sequential navigation from the "Boutons" heading, then Tab to the first button.
  await page.getByRole("heading", { level: 2, name: "Boutons", exact: true }).click();
  await page.keyboard.press("Tab");
  const first = page.getByRole("button", { name: "Principal" });
  await expect(first).toBeFocused();
  await expect(first).toHaveCSS("outline-style", "solid");
  await expect(first).toHaveCSS("outline-width", "3px");
  await expect(first).toHaveCSS("outline-color", ringColor);

  const second = page.getByRole("button", { name: "Secondaire" });
  await second.click();
  await expect(second).toBeFocused();
  await expect(second).toHaveCSS("outline-style", "none");
});

test("a loading button is disabled and named with its loading label", async ({ page }) => {
  await page.goto(localUrl("careerboost.localhost", "/dev/components"));
  const loading = page.getByRole("button", { name: "Envoyer (envoi en cours)" });
  await expect(loading).toBeDisabled();
  await expect(loading).toHaveAttribute("aria-busy", "true");
});

test("animations stop when the visitor asks for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(localUrl("upwilling.localhost", "/dev/components"));
  // The page has other status regions (form submission, Task 2.2b): pick the spinner's.
  const spinner = page.getByRole("status").filter({ hasText: "Chargement des formations" });
  await expect(spinner.locator("svg")).toHaveCSS("animation-iteration-count", "1");
});
