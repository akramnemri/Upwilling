import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getEnv } from "../lib/env";
import { UNDER_CONSTRUCTION, UnderConstructionPage } from "../modules/content";
import { resolveHost } from "../modules/core";

// Public sites: branded "under construction" page (Task 1.2). Admin host: placeholder until Milestone 3.
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

  return (
    <main>
      <h1>UpWilling — en construction</h1>
      <p>
        {target.kind === "admin"
          ? "Hôte résolu : espace d'administration (disponible au Milestone 3)."
          : "Hôte résolu : réception des webhooks (aucune page publique)."}
      </p>
      <p>Environnement : {getEnv().DEPLOY_ENV}</p>
    </main>
  );
}
