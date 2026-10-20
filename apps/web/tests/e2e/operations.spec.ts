import { expect, test } from "@playwright/test";

import { localUrl } from "./hosts";

test("/api/health answers on any host, including bare localhost (Docker healthcheck)", async ({
  page,
}) => {
  const response = await page.goto(localUrl("localhost", "/api/health"));

  expect(response?.status()).toBe(200);
  expect(await response?.json()).toEqual({ status: "ok" });
});

test("/api/ready reports ready with the database check still a placeholder (ADR-005)", async ({
  page,
}) => {
  const response = await page.goto(localUrl("upwilling.localhost", "/api/ready"));

  expect(response?.status()).toBe(200);
  expect(await response?.json()).toEqual({
    status: "ready",
    checks: { config: "ok", database: "not_configured" },
  });
});

test("a failing page shows the safe French error page with a reference, never the error details", async ({
  page,
}) => {
  const response = await page.goto(localUrl("upwilling.localhost", "/dev/test-error"));

  expect(response?.status()).toBe(500);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Une erreur est survenue");
  await expect(page.getByText(/^Référence : \S+$/)).toBeVisible();
  // The thrown message contains a fake secret: it must stay in the (redacted) server log only.
  expect(await page.content()).not.toContain("fake-secret-456");
});

test('/api/version reports the build ("local" when the image was not published)', async ({
  page,
}) => {
  const response = await page.goto(localUrl("careerboost.localhost", "/api/version"));

  expect(response?.status()).toBe(200);
  expect(await response?.json()).toEqual({ version: "local" });
});
