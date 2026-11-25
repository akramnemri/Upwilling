/**
 * Local seed: `pnpm seed` from apps/web, after `pnpm migrate` (data in scripts/seed-data.ts).
 * Refuses to run outside DEPLOY_ENV=local, so the well-known local password can never reach recette or
 * production.
 */
import { getPayload } from "payload";

import { getEnv } from "../src/lib/env";
import config from "../src/payload.config";
import { SEED_ADMIN, seed } from "./seed-data";

if (getEnv().DEPLOY_ENV !== "local") {
  throw new Error("The seed only runs with DEPLOY_ENV=local.");
}

const payload = await getPayload({ config });
try {
  const result = await seed(payload);
  payload.logger.info(
    `Seed done: administrator ${result.adminCreated ? "created" : "already present"} (${SEED_ADMIN.email}), ` +
      `image ${result.imageCreated ? "created" : "already present"}.`,
  );
} finally {
  await payload.destroy();
}
