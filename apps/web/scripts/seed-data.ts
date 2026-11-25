/**
 * Seed data (Task 3.1): one administrator and one image, synthetic only. Safe to apply again: existing
 * records are left untouched. Run by `pnpm seed` (scripts/seed.ts) and by the integration tests.
 */
import type { Payload } from "payload";
import sharp from "sharp";

// Synthetic, local-only login for the admin at http://admin.localhost:3000/admin (CLAUDE.md: no real data).
export const SEED_ADMIN = {
  email: "admin@example.test",
  password: "local-admin-only-1",
  name: "Administrateur local",
} as const;

export const SEED_IMAGE_ALT = "Image de démonstration (dégradé bleu)";

export type SeedResult = { adminCreated: boolean; imageCreated: boolean };

// The seed acts as the system, not for a request: it creates the first administrator, so there is no
// user to check access against. Every call below passes overrideAccess: true on purpose.
export async function seed(payload: Payload): Promise<SeedResult> {
  const existingAdmins = await payload.find({
    collection: "users",
    where: { email: { equals: SEED_ADMIN.email } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const adminCreated = existingAdmins.totalDocs === 0;
  if (adminCreated) {
    await payload.create({ collection: "users", data: SEED_ADMIN, overrideAccess: true });
  }

  const existingImages = await payload.find({
    collection: "media",
    where: { alt: { equals: SEED_IMAGE_ALT } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const imageCreated = existingImages.totalDocs === 0;
  if (imageCreated) {
    await payload.create({
      collection: "media",
      data: { alt: SEED_IMAGE_ALT },
      file: await syntheticImage(),
      overrideAccess: true,
    });
  }

  return { adminCreated, imageCreated };
}

/** A generated 640×360 PNG: no photo or third-party file in the repository. */
async function syntheticImage(): Promise<{
  data: Buffer;
  mimetype: string;
  name: string;
  size: number;
}> {
  const data = await sharp({
    create: { width: 640, height: 360, channels: 3, background: { r: 30, g: 64, b: 175 } },
  })
    .png()
    .toBuffer();
  return { data, mimetype: "image/png", name: "seed-demo.png", size: data.length };
}
