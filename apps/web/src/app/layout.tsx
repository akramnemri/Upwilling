import { temporaryBrandCss, type Brand } from "@upwilling/design-system";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { getEnv } from "../lib/env";
import { buildSiteMetadata } from "../modules/content";
import { resolveHost } from "../modules/core";
import styles from "./layout.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const rawHost = (await headers()).get("host");
  const { DEPLOY_ENV } = getEnv();
  return buildSiteMetadata({
    target: resolveHost(rawHost, DEPLOY_ENV),
    rawHost,
    deployEnv: DEPLOY_ENV,
  });
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const target = resolveHost((await headers()).get("host"), getEnv().DEPLOY_ENV);
  // The admin and hooks hosts have no brand of their own: they use the academy theme.
  const brand: Brand = target?.kind === "site" ? target.tenant : "upwilling";

  return (
    <html lang="fr" data-brand={brand}>
      <head>
        {/* Temporary theme variables (Task 1.2) until the token stylesheet of Task 2.1. */}
        <style>{temporaryBrandCss(brand)}</style>
      </head>
      <body className={styles.body}>{children}</body>
    </html>
  );
}
