import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

// One smoke test per local host: the request reaches the app and resolves to the right tenant.
const KNOWN_HOSTS = [
  { host: "upwilling.localhost", expectedText: "tenant « upwilling »" },
  { host: "careerboost.localhost", expectedText: "tenant « careerboost »" },
  { host: "admin.localhost", expectedText: "espace d'administration" },
] as const;

for (const { host, expectedText } of KNOWN_HOSTS) {
  test(`${host} serves its own home page`, async ({ page }) => {
    const response = await page.goto(localUrl(host));

    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-request-id"]).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("UpWilling — en construction");
    await expect(page.getByText(expectedText)).toBeVisible();
  });
}

// Unknown hosts must never fall back to a tenant: a wrong fallback would show one site under another's name.
for (const host of ["unknown.localhost", "localhost"]) {
  test(`${host} is refused with 404`, async ({ page }) => {
    const response = await page.goto(localUrl(host));

    expect(response?.status()).toBe(404);
    await expect(page.getByText("upwilling", { exact: false })).toHaveCount(0);
  });
}
