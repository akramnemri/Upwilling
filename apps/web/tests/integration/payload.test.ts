import { readdir, rm } from "node:fs/promises";

import { getPayload, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SEED_ADMIN, SEED_IMAGE_ALT, seed } from "../../scripts/seed-data";
import { checkDatabase } from "../../src/lib/database-check";
import { getEnv } from "../../src/lib/env";
import config from "../../src/payload.config";

// Runs against the `app_test` database (vitest.config.ts): local PostgreSQL from infra/local/compose.yaml,
// or CI's service container. Every run rebuilds the schema from the committed migrations, so these tests
// also prove that the migrations run in order on a clean database (03_GIT_TESTING_PIPELINE.md §10).
let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
  // Drops every table, then runs all migrations. Test database only.
  await payload.db.migrateFresh({ forceAcceptWarning: true });
}, 120_000);

afterAll(async () => {
  await payload.destroy();
  // Uploaded test files land in the test media folder (MEDIA_DIR in vitest.config.ts).
  const mediaDir = getEnv().MEDIA_DIR;
  if (mediaDir !== undefined) {
    await rm(mediaDir, { recursive: true, force: true });
  }
});

describe("migrations", () => {
  it("leave no migration pending after a fresh run", async () => {
    const applied = await payload.find({
      collection: "payload-migrations",
      depth: 0,
      limit: 100,
      overrideAccess: true, // system check, no user involved
    });
    const names = applied.docs.map((doc) => doc.name);
    expect(names).toContain("20261125_185819_initial");
    // `dev` would mean Payload pushed the schema itself instead of running migrations.
    expect(names).not.toContain("dev");
  });
});

describe("readiness database check (Task 3.1b)", () => {
  it("reports ok once the migrations ran", async () => {
    expect(await checkDatabase()).toBe("ok");
  });
});

describe("seed", () => {
  it("creates the administrator and the image once, and changes nothing when run again", async () => {
    expect(await seed(payload)).toEqual({ adminCreated: true, imageCreated: true });
    expect(await seed(payload)).toEqual({ adminCreated: false, imageCreated: false });

    const admins = await payload.count({
      collection: "users",
      where: { email: { equals: SEED_ADMIN.email } },
      overrideAccess: true,
    });
    expect(admins.totalDocs).toBe(1);
    const mediaDir = getEnv().MEDIA_DIR;
    expect(mediaDir).toBeDefined();
    expect(await readdir(mediaDir ?? "")).toContain("seed-demo.png");
  });
});

describe("access control (deny by default)", () => {
  it("hides users from anonymous requests", async () => {
    await expect(
      payload.find({ collection: "users", depth: 0, overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("lets anyone read public media but refuses anonymous uploads and changes", async () => {
    const media = await payload.find({ collection: "media", depth: 0, overrideAccess: false });
    expect(media.docs.map((doc) => doc.alt)).toContain(SEED_IMAGE_ALT);

    await expect(
      payload.create({
        collection: "media",
        data: { alt: "Envoyé sans connexion" },
        file: {
          data: TINY_PNG,
          mimetype: "image/png",
          name: "anonymous.png",
          size: TINY_PNG.length,
        },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      payload.update({
        collection: "media",
        where: { alt: { equals: SEED_IMAGE_ALT } },
        data: { alt: "Modifié sans connexion" },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("localization (ADR-014)", () => {
  it("serves French by default and falls back to French while English is empty", async () => {
    const created = await payload.create({
      collection: "media",
      data: { alt: "Texte en français" },
      file: {
        data: TINY_PNG,
        mimetype: "image/png",
        name: "locale-test.png",
        size: TINY_PNG.length,
      },
      overrideAccess: true, // test setup
    });

    const english = await payload.findByID({
      collection: "media",
      id: created.id,
      locale: "en",
      depth: 0,
      overrideAccess: true,
    });
    expect(english.alt).toBe("Texte en français");

    await payload.update({
      collection: "media",
      id: created.id,
      locale: "en",
      data: { alt: "English text" },
      overrideAccess: true,
    });
    const [french, updatedEnglish] = await Promise.all(
      (["fr", "en"] as const).map((locale) =>
        payload.findByID({
          collection: "media",
          id: created.id,
          locale,
          depth: 0,
          overrideAccess: true,
        }),
      ),
    );
    expect(french?.alt).toBe("Texte en français");
    expect(updatedEnglish?.alt).toBe("English text");
  });
});

// Smallest valid PNG (1×1 transparent pixel): no binary fixture file in the repository.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
