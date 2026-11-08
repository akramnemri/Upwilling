import "@upwilling/design-system/tokens.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { getEnv } from "../lib/env";
import { brandForHost, buildSiteMetadata } from "../modules/content";
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
  const brand = brandForHost(resolveHost((await headers()).get("host"), getEnv().DEPLOY_ENV));

  return (
    // `data-brand` selects the brand's block in tokens.css: every `--uw-color-*` variable depends on it.
    <html lang="fr" data-brand={brand}>
      <body className={styles.body}>{children}</body>
    </html>
  );
}
