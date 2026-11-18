import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

// Self-hosted fonts (Task 2.4a): both sites preload the two brand fonts from their own origin, and
// the text uses them through the `--uw-font-family-*` tokens.

for (const host of ["upwilling.localhost", "careerboost.localhost"]) {
  test(`${host} preloads and uses the self-hosted fonts`, async ({ page }) => {
    const fontResponses: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      if (response.url().endsWith(".woff2")) {
        fontResponses.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto(localUrl(host));

    // Two preloads (display and body), served by the application itself.
    const preloads = page.locator('link[rel="preload"][as="font"]');
    await expect(preloads).toHaveCount(2);
    for (const href of await preloads.evaluateAll((links) =>
      links.map((link) => (link as HTMLLinkElement).href),
    )) {
      expect(new URL(href).host).toBe(new URL(page.url()).host);
    }

    const families = await page.evaluate(async () => {
      await document.fonts.ready;
      const root = getComputedStyle(document.documentElement);
      const first = (variable: string) =>
        root.getPropertyValue(variable).split(",")[0]?.trim().replaceAll(/["']/g, "") ?? "";
      const display = first("--uw-font-face-display");
      const body = first("--uw-font-face-body");
      // A page may not use the display font yet: ask for both, as text using them would.
      const displayFaces = await document.fonts.load(`700 16px "${display}"`);
      const bodyFaces = await document.fonts.load(`400 16px "${body}"`);
      return {
        display,
        body,
        bodyUses: getComputedStyle(document.body).fontFamily,
        displayLoaded: displayFaces.some((face) => face.status === "loaded"),
        bodyLoaded: bodyFaces.some((face) => face.status === "loaded"),
      };
    });

    expect(families.display).not.toBe("");
    expect(families.body).not.toBe("");
    expect(families.bodyUses).toContain(families.body);
    expect(families.displayLoaded).toBe(true);
    expect(families.bodyLoaded).toBe(true);
    expect(fontResponses.length).toBeGreaterThan(0);
    expect(fontResponses.every((font) => font.status === 200)).toBe(true);
  });
}
