import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getEnv } from "../../../../lib/env";
import { SiteLayout } from "../../../../modules/content";
import { resolveHost } from "../../../../modules/core";
import { AcademyDemo, CareerBoostDemo } from "./demo-content";

// Rendered per request: the tenant comes from the Host header, and at build time there is no
// DEPLOY_ENV to check.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Démonstration de la page d’accueil" };

/**
 * Demo home page per brand for the PO design review (Task 2.5c): the site's header and footer
 * around the section patterns, with synthetic copy. Local and recette only: the footer's legal line
 * is still a placeholder, and the route rules also refuse /dev in production.
 */
export default async function DemoPage() {
  const { DEPLOY_ENV } = getEnv();
  if (DEPLOY_ENV === "production") {
    notFound();
  }
  const target = resolveHost((await headers()).get("host"), DEPLOY_ENV);
  if (target?.kind !== "site") {
    notFound();
  }

  return (
    <SiteLayout tenant={target.tenant}>
      {target.tenant === "upwilling" ? <AcademyDemo /> : <CareerBoostDemo />}
    </SiteLayout>
  );
}
