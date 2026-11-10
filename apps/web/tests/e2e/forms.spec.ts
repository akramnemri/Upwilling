import { expect, type Page, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Form components on the preview page (Task 2.2b), in Chromium: what assistive technology receives,
// keyboard behavior of the choice cards, and the pending state of a submission. The axe check of the
// whole page (both brands) is in components.spec.ts.

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

test("fields give their label, help and error to assistive technology", async ({ page }) => {
  await page.goto(localUrl("careerboost.localhost", "/dev/components"));

  const email = page.getByRole("textbox", { name: "Adresse e-mail (obligatoire)" });
  await expect(email).toHaveAccessibleDescription("Nous vous répondrons à cette adresse.");
  await expect(email).toHaveJSProperty("required", true);
  await expect(email).not.toHaveAttribute("aria-invalid");

  const postcode = page.getByRole("textbox", { name: "Code postal" });
  await expect(postcode).toHaveAttribute("aria-invalid", "true");
  await expect(postcode).toHaveAccessibleDescription("Le code postal doit contenir cinq chiffres.");
  await expect(postcode).toHaveCSS("border-top-color", await roleColor(page, "danger"));

  await expect(page.getByRole("group", { name: "Votre niveau" })).toHaveAccessibleDescription(
    "Choisissez votre niveau.",
  );
  await expect(page.getByRole("radio", { name: "Présentiel" })).toHaveAccessibleDescription(
    "Dans nos locaux, en petit groupe.",
  );
  await expect(
    page.getByRole("checkbox", { name: "J’accepte les conditions générales" }),
  ).toHaveAccessibleDescription("Cochez la case pour continuer.");
});

test("choice cards: arrows move the choice and the card shows the keyboard focus ring", async ({
  page,
}) => {
  await page.goto(localUrl("upwilling.localhost", "/dev/components"));
  const ringColor = await roleColor(page, "focus-ring");

  // Start sequential navigation from the section heading, then Tab into the first group.
  await page
    .getByRole("heading", { level: 2, name: "Cases, boutons radio et cartes de choix" })
    .click();
  await page.keyboard.press("Tab");
  const onSite = page.getByRole("radio", { name: "Présentiel" });
  const onSiteCard = page.locator("label").filter({ has: onSite });
  await expect(onSite).toBeFocused();
  await expect(onSiteCard).toHaveCSS("outline-style", "solid");
  await expect(onSiteCard).toHaveCSS("outline-color", ringColor);

  await page.keyboard.press("ArrowRight");
  const remote = page.getByRole("radio", { name: "À distance" });
  await expect(remote).toBeFocused();
  await expect(remote).toBeChecked();
  await expect(page.locator("label").filter({ has: remote })).toHaveCSS("outline-style", "solid");
  await expect(onSiteCard).toHaveCSS("outline-style", "none");

  // The disabled card is skipped: the next arrow wraps to the first card.
  await page.keyboard.press("ArrowRight");
  await expect(onSite).toBeChecked();

  // A mouse click anywhere on a card selects it, without the keyboard focus ring.
  const data = page.getByRole("checkbox", { name: "Données" });
  await page.getByText("Données", { exact: true }).click();
  await expect(data).toBeChecked();
  await expect(page.locator("label").filter({ has: data })).toHaveCSS("outline-style", "none");
});

test("a pending submission is announced, keeps the focus and cannot be sent twice", async ({
  page,
}) => {
  await page.goto(localUrl("careerboost.localhost", "/dev/components"));
  const button = page.getByRole("button", { name: "Envoyer la demande" });
  const pending = page.getByRole("status").filter({ hasText: "Envoi en cours" });
  await expect(pending).toHaveCount(0);

  await page.getByRole("textbox", { name: "Votre prénom" }).fill("Camille");
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(pending).toHaveCount(1);
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).toBeFocused();
  // Refused while pending: a second submission would keep the button busy and count 2.
  await page.keyboard.press("Enter");

  await expect(button).not.toHaveAttribute("aria-disabled");
  await expect(page.getByRole("status").filter({ hasText: "Envois simulés" })).toHaveText(
    "Demande envoyéeEnvois simulés : 1.",
  );
  await expect(button).toBeFocused();
  await expect(pending).toHaveCount(0);
});
