import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getEnv } from "../../lib/env";
import { UNDER_CONSTRUCTION, UnderConstructionPage } from "../../modules/content";
import { resolveHost } from "../../modules/core";

// Public sites: branded "under construction" page (Task 1.2). Admin host: Payload's admin (Task 3.1).
export default async function HomePage() {
  const requestHeaders = await headers();
  // The proxy already refuses unknown hosts; resolving again here keeps the page safe on its own.
  const target = resolveHost(requestHeaders.get("host"), getEnv().DEPLOY_ENV);
  if (target === null) {
    notFound();
  }

  if (target.kind === "site") {
    return <UnderConstructionPage content={UNDER_CONSTRUCTION[target.tenant]} />;
  }

  // The hooks host never reaches this page (core resolveRoute serves only /api/webhooks there).
  redirect("/admin");
}
