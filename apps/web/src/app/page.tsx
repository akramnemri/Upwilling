import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getEnv } from "../lib/env";
import { resolveHost, type HostTarget } from "../modules/core";

// Temporary page (Task 0.3): shows what the current host resolves to. Replaced by real pages in M2/M3.
export default async function HomePage() {
  const requestHeaders = await headers();
  // The proxy already refuses unknown hosts; resolving again here keeps the page safe on its own.
  const target = resolveHost(requestHeaders.get("host"), getEnv().DEPLOY_ENV);
  if (target === null) {
    notFound();
  }

  return (
    <main>
      <h1>UpWilling — en construction</h1>
      <p>{describeTarget(target)}</p>
      <p>Environnement : {getEnv().DEPLOY_ENV}</p>
    </main>
  );
}

function describeTarget(target: HostTarget): string {
  switch (target.kind) {
    case "site":
      return target.tenant === "upwilling"
        ? "Site résolu : UpWilling (académie) — tenant « upwilling »."
        : "Site résolu : UpWilling Career Boost (association) — tenant « careerboost ».";
    case "admin":
      return "Hôte résolu : espace d'administration (disponible au Milestone 3).";
    case "hooks":
      return "Hôte résolu : réception des webhooks (aucune page publique).";
  }
}
