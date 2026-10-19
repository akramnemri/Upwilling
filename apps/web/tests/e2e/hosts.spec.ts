import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

// One smoke test per local host: the request reaches the app and resolves to the right tenant.
// Brand details (title, logo, robots) are covered in brand-pages.spec.ts.
const KNOWN_HOSTS = [
  { host: "upwilling.localhost", heading: "Notre nouveau site arrive bientôt." },
  {
    host: "careerboost.localhost",
    heading: "Investir en vous aujourd’hui, construire la vie que vous voulez demain.",
  },
  { host: "admin.localhost", heading: "UpWilling — en construction" },
] as const;

for (const { host, heading } of KNOWN_HOSTS) {
  test(`${host} serves its own home page`, async ({ page }) => {
    const response = await page.goto(localUrl(host));

    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-request-id"]).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
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

// Public sites never expose the admin or unlisted API routes, even before Payload is installed (01 §5.3).
for (const path of ["/admin", "/api/users", "/%61dmin"]) {
  test(`upwilling.localhost refuses ${path} with 404`, async ({ page }) => {
    const response = await page.goto(localUrl("upwilling.localhost", path));

    expect(response?.status()).toBe(404);
    // The proxy's plain-text 404, not the app's not-found page: the request never reached a route.
    expect(response?.headers()["content-type"]).toContain("text/plain");
  });
}
