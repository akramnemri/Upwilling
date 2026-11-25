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
] as const;

for (const { host, heading } of KNOWN_HOSTS) {
  test(`${host} serves its own home page`, async ({ page }) => {
    const response = await page.goto(localUrl(host));

    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-request-id"]).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  });
}

// The admin host's home leads to Payload's admin (Task 3.1). Only the redirect is checked here: the admin
// itself needs the database, which the integration tests and the manual test cover.
test("admin.localhost redirects its home page to /admin", async ({ request }) => {
  const response = await request.get(localUrl("admin.localhost"), { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toBe("/admin");
});

// Unknown hosts must never fall back to a tenant: a wrong fallback would show one site under another's name.
for (const host of ["unknown.localhost", "localhost"]) {
  test(`${host} is refused with 404`, async ({ page }) => {
    const response = await page.goto(localUrl(host));

    expect(response?.status()).toBe(404);
    await expect(page.getByText("upwilling", { exact: false })).toHaveCount(0);
  });
}

// Public sites never expose the admin or Payload's API (01 §5.3).
for (const path of ["/admin", "/api/users", "/%61dmin", "/api/media/file/seed-demo.png"]) {
  test(`upwilling.localhost refuses ${path} with 404`, async ({ page }) => {
    const response = await page.goto(localUrl("upwilling.localhost", path));

    expect(response?.status()).toBe(404);
    // The proxy's plain-text 404, not the app's not-found page: the request never reached a route.
    expect(response?.headers()["content-type"]).toContain("text/plain");
  });
}

// Since Task 3.1 the app has two root layouts, so unmatched URLs use src/app/global-not-found.tsx.
test("an unknown page on a site answers 404 with the site's French not-found page", async ({
  page,
}) => {
  const response = await page.goto(localUrl("careerboost.localhost", "/page-inexistante"));

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page introuvable");
  await expect(page.locator("html")).toHaveAttribute("data-brand", "careerboost");
});
