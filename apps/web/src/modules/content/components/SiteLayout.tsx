import { ButtonLink, SiteFooter, SiteHeader } from "@upwilling/design-system/react";
import Image from "next/image";
import NextLink from "next/link";
import type { ReactNode } from "react";

import type { TenantSlug } from "../../core";
import { SITE_CHROME } from "../site-chrome";
import { UNDER_CONSTRUCTION } from "../under-construction";

const MAIN_ID = "contenu";

/**
 * The frame of a public page of one site (Task 2.4b): skip link, sticky header, `main`, footer.
 * The tenant comes from the request host (the caller resolves it); the brand's colors come from
 * `data-brand` on `<html>` (root layout). The public route group of Milestone 5 wraps its pages in
 * it; until then only `/dev/site` uses it (the legal details are still placeholders).
 */
export function SiteLayout({
  tenant,
  children,
}: Readonly<{ tenant: TenantSlug; children: ReactNode }>) {
  const chrome = SITE_CHROME[tenant];

  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-modal focus-visible:rounded-md focus-visible:bg-surface focus-visible:px-4 focus-visible:py-2 focus-visible:font-semibold focus-visible:text-primary focus-visible:focus-ring"
      >
        {chrome.skipLinkLabel}
      </a>
      <SiteHeader
        logo={<SiteLogo tenant={tenant} homeLabel={chrome.homeLabel} />}
        navLabel={chrome.navLabel}
        menuLabel={chrome.menuLabel}
        items={chrome.items}
        cta={
          chrome.cta === null ? undefined : (
            <ButtonLink href={chrome.cta.href} size="sm">
              {chrome.cta.label}
            </ButtonLink>
          )
        }
      />
      <main id={MAIN_ID}>{children}</main>
      <SiteFooter
        columns={chrome.footer.columns}
        legalNavLabel={chrome.footer.legalNavLabel}
        legalLinks={chrome.footer.legalLinks}
        legalEntity={chrome.footer.legalEntity}
      />
    </>
  );
}

// Logo height in the 4rem header row: 3rem (48 px). Width and height are given, so the image takes
// its place before it loads (no layout shift).
const LOGO_HEIGHT = 48;

/** The brand's logo as a link to the home page; the academy shows its mark and name until the PO
 * sends its logo files. The images are decorative: the link's name says where it goes. */
function SiteLogo({ tenant, homeLabel }: Readonly<{ tenant: TenantSlug; homeLabel: string }>) {
  const brand = UNDER_CONSTRUCTION[tenant];
  const logo = brand.logo;

  return (
    <NextLink
      href="/"
      aria-label={homeLabel}
      className="flex items-center gap-2 rounded-sm font-display text-xl font-bold text-text focus-visible:focus-ring"
    >
      {logo === null ? (
        <>
          <Image src={brand.icon.src} width={40} height={40} alt="" priority unoptimized />
          <span>{brand.siteName}</span>
        </>
      ) : (
        <Image
          src={logo.src}
          width={Math.round((logo.width * LOGO_HEIGHT) / logo.height)}
          height={LOGO_HEIGHT}
          alt=""
          priority
          // Already sized and compressed: no runtime image optimization (and no sharp) needed.
          unoptimized
        />
      )}
    </NextLink>
  );
}
