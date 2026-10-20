import type { Metadata } from "next";

import type { DeployEnv } from "../../lib/env";
import { normalizeHost, type HostTarget } from "../core";
import { isIndexable } from "./indexing";
import { UNDER_CONSTRUCTION } from "./under-construction";

const NO_INDEX = { index: false, follow: false } as const;

/**
 * Page metadata for the host of the request (title, description, icons, Open Graph, robots).
 * `target` comes from `resolveHost`: the tenant is never taken from anything but the Host header.
 */
export function buildSiteMetadata(request: {
  target: HostTarget | null;
  rawHost: string | null;
  deployEnv: DeployEnv;
}): Metadata {
  const { target, rawHost, deployEnv } = request;
  if (target?.kind !== "site") {
    return { title: "UpWilling", robots: NO_INDEX };
  }

  const content = UNDER_CONSTRUCTION[target.tenant];
  const origin = siteOrigin(rawHost, deployEnv);
  return {
    ...(origin === null ? {} : { metadataBase: new URL(origin) }),
    title: content.metaTitle,
    description: content.description,
    applicationName: content.siteName,
    robots: isIndexable(target, deployEnv) ? { index: true, follow: true } : NO_INDEX,
    icons: {
      icon: [{ url: content.icon.src, type: content.icon.type }],
      ...(content.appleIcon === null ? {} : { apple: content.appleIcon }),
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: content.siteName,
      title: content.metaTitle,
      description: content.description,
      ...(origin === null || content.ogImage === null
        ? {}
        : {
            images: [
              {
                url: content.ogImage.src,
                width: content.ogImage.width,
                height: content.ogImage.height,
                alt: content.siteName,
              },
            ],
          }),
    },
  };
}

/**
 * Origin used for absolute URLs (Open Graph). Local servers keep their port; deployed sites are HTTPS
 * behind Caddy on the default port. Null when the host is not a plain hostname.
 */
export function siteOrigin(rawHost: string | null, deployEnv: DeployEnv): string | null {
  const host = normalizeHost(rawHost);
  if (host === null || rawHost === null) {
    return null;
  }
  if (deployEnv !== "local") {
    return `https://${host}`;
  }
  const port = /:(\d{1,5})$/.exec(rawHost.trim())?.[1];
  return port === undefined ? `http://${host}` : `http://${host}:${port}`;
}
