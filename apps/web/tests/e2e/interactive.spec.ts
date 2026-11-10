import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Interactive components on the preview page (Task 2.2c), in Chromium: what jsdom cannot show
// (native details grouping, the modal dialog's top layer, inert page, Escape and focus return). The
// axe check of the whole page, dialog closed, is in components.spec.ts.

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** The computed value of a color role, in the browser's own color syntax. */
async function roleColor(page: Page, role: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--uw-color-${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, role);
}

/** The `<details>` element whose summary has this text. */
function panel(page: Page, title: string): Locator {
  return page.locator("details").filter({ has: page.locator("summary", { hasText: title }) });
}

test("accordion: summaries take the keyboard; an exclusive group keeps one panel open", async ({
  page,
}) => {
  await page.goto(localUrl("upwilling.localhost", "/dev/components"));
  const duration = panel(page, "Combien de temps dure une formation ?");
  const funding = panel(page, "Comment financer ma formation ?");

  await expect(duration).toHaveJSProperty("open", true);
  await expect(page.getByText("De quatre à douze semaines")).toBeVisible();
  await expect(page.getByText("Plusieurs aides existent")).toBeHidden();

  // Start sequential navigation from the section heading.
  await page.getByRole("heading", { level: 2, name: "Accordéon", exact: true }).click();
  await page.keyboard.press("Tab");
  await expect(duration.locator("summary")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(funding.locator("summary")).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(funding).toHaveJSProperty("open", true);
  await expect(duration).toHaveJSProperty("open", false);
  await expect(page.getByText("Plusieurs aides existent")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(funding).toHaveJSProperty("open", false);

  // Independent panels stay open together.
  const first = panel(page, "Module 1 — Les bases du web");
  const second = panel(page, "Module 2 — JavaScript");
  await first.locator("summary").click();
  await second.locator("summary").click();
  await expect(first).toHaveJSProperty("open", true);
  await expect(second).toHaveJSProperty("open", true);
});

test("tabs: one Tab stop, arrows select, Tab enters the panel", async ({ page }) => {
  await page.goto(localUrl("careerboost.localhost", "/dev/components"));
  const primary = await roleColor(page, "primary");

  await page.getByRole("heading", { level: 2, name: "Onglets", exact: true }).click();
  await page.keyboard.press("Tab");
  const web = page.getByRole("tab", { name: "Web" });
  await expect(web).toBeFocused();
  await expect(web).toHaveAttribute("aria-selected", "true");
  await expect(web).toHaveCSS("background-color", primary);

  await page.keyboard.press("ArrowRight");
  const data = page.getByRole("tab", { name: "Données" });
  await expect(data).toBeFocused();
  await expect(data).toHaveAttribute("aria-selected", "true");
  await expect(web).toHaveAttribute("aria-selected", "false");
  const dataPanel = page.getByRole("tabpanel", { name: "Données" });
  await expect(dataPanel).toContainText("Nettoyer, analyser et présenter des données.");

  await page.keyboard.press("Tab");
  await expect(dataPanel).toBeFocused();
  await expect(dataPanel).toHaveCSS("outline-style", "solid");
});

test("dialog: modal, focus inside, Escape closes and focus returns to the trigger", async ({
  page,
}) => {
  await page.goto(localUrl("upwilling.localhost", "/dev/components"));
  const trigger = page.getByRole("button", { name: "Voir le programme" });
  const dialog = page.getByRole("dialog", { name: "Programme de la formation" });
  const close = page.getByRole("button", { name: "Fermer" });
  await expect(dialog).toBeHidden();

  await page.getByRole("heading", { level: 2, name: "Boîte de dialogue", exact: true }).click();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(
    "Douze semaines, trois modules, un projet final.",
  );
  await expect(close).toBeFocused();
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  const { violations } = await new AxeBuilder({ page })
    .include("dialog")
    .withTags(WCAG_TAGS)
    .analyze();
  expect(violations.map(({ id, help, nodes }) => `${id}: ${help} × ${nodes.length}`)).toEqual([]);

  // The page behind is inert: the keyboard never reaches it, in either direction.
  const outsideFocus = () =>
    page.evaluate(() => {
      const active = document.activeElement;
      return active !== null && active !== document.body && active.closest("dialog") === null;
    });
  for (const key of ["Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    expect(await outsideFocus()).toBe(false);
  }
  // A click on the backdrop does not close it.
  await page.mouse.click(4, 4);
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");

  // A button in `<form method="dialog">` closes it without JavaScript of its own.
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "J’ai compris" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("breadcrumbs: a named landmark ending on the current page", async ({ page }) => {
  await page.goto(localUrl("careerboost.localhost", "/dev/components"));
  const nav = page.getByRole("navigation", { name: "Fil d’Ariane" });
  await expect(nav.getByRole("listitem")).toHaveCount(3);
  await expect(nav.getByRole("link")).toHaveText(["Accueil", "Formations"]);
  await expect(nav.getByText("Développement web")).toHaveAttribute("aria-current", "page");
});
