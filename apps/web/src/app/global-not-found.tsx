import "./(frontend)/globals.css";

import { fontVariables } from "@upwilling/design-system/fonts";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { getEnv } from "../lib/env";
import { brandForHost } from "../modules/content";
import { resolveHost } from "../modules/core";
import styles from "./(frontend)/layout.module.css";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

/**
 * 404 for URLs that match no route. Since Task 3.1 the app has two root layouts (public sites and
 * Payload's admin), so this page renders its own <html>, with the brand of the requested host.
 * `notFound()` inside the public pages still uses (frontend)/not-found.tsx.
 */
export default async function GlobalNotFound() {
  const brand = brandForHost(resolveHost((await headers()).get("host"), getEnv().DEPLOY_ENV));
  return (
    <html lang="fr" data-brand={brand} className={fontVariables}>
      <body className={styles.body}>
        <main>
          <h1>Page introuvable</h1>
          <p>La page demandée n&apos;existe pas ou a été déplacée.</p>
          <Link href="/">Retour à l&apos;accueil</Link>
        </main>
      </body>
    </html>
  );
}
