import type { SiteLink } from "@upwilling/design-system/react";

import type { TenantSlug } from "../core";

/**
 * Header and footer content of each site (Task 2.4b), until the navigation and footer globals exist
 * in the CMS (Task 5.2). French copy.
 *
 * The legal details are PO inputs (01_ARCHITECTURE.md §6: per-tenant settings). Until the PO gives
 * them, the footer shows a visible placeholder, never invented details, and this content is only
 * rendered on `/dev/site` (refused in production). Before a public page uses it, every
 * `PLACEHOLDER_*` value must be replaced.
 */
export interface SiteChromeContent {
  /** Accessible name of the logo link, e.g. "UpWilling, accueil". */
  homeLabel: string;
  /** Text of the skip link, the first focusable element of every page. */
  skipLinkLabel: string;
  navLabel: string;
  menuLabel: string;
  /** Anchors of the page's sections (one-page home) or the site's main pages. */
  items: readonly SiteLink[];
  cta: SiteLink | null;
  footer: {
    columns: readonly { title: string; links: readonly SiteLink[] }[];
    legalNavLabel: string;
    legalLinks: readonly SiteLink[];
    legalEntity: string;
  };
}

/** Shown instead of the legal entity line until the PO sends the real details. */
export const PLACEHOLDER_LEGAL_ENTITY =
  "[À compléter par le PO] Raison sociale, forme juridique, adresse du siège, numéro SIRET";

// Pages written in Task 5.2 (legal page templates); the links point at their future paths.
const LEGAL_LINKS: readonly SiteLink[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Cookies", href: "/cookies" },
];

const COMMON = {
  skipLinkLabel: "Aller au contenu",
  navLabel: "Navigation principale",
  menuLabel: "Menu",
} as const;

const ACADEMY_ITEMS: readonly SiteLink[] = [
  { label: "Formations", href: "#formations" },
  { label: "Méthode", href: "#methode" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Questions fréquentes", href: "#faq" },
];

const ASSOCIATION_ITEMS: readonly SiteLink[] = [
  { label: "L’association", href: "#association" },
  { label: "Nos actions", href: "#actions" },
  { label: "Actualités", href: "#actualites" },
  { label: "Questions fréquentes", href: "#faq" },
];

export const SITE_CHROME: Readonly<Record<TenantSlug, SiteChromeContent>> = {
  upwilling: {
    ...COMMON,
    homeLabel: "UpWilling, accueil",
    items: ACADEMY_ITEMS,
    cta: { label: "Demander un devis", href: "#contact" },
    footer: {
      columns: [
        { title: "Le centre de formation", links: ACADEMY_ITEMS },
        { title: "Contact", links: [{ label: "Demander un devis", href: "#contact" }] },
      ],
      legalNavLabel: "Informations légales",
      legalLinks: LEGAL_LINKS,
      // The academy line also needs the training organization's declaration number (01 §6).
      legalEntity: `${PLACEHOLDER_LEGAL_ENTITY}, numéro de déclaration d’activité`,
    },
  },
  careerboost: {
    ...COMMON,
    homeLabel: "UpWilling Career Boost, accueil",
    items: ASSOCIATION_ITEMS,
    cta: { label: "Adhérer", href: "#adherer" },
    footer: {
      columns: [
        { title: "L’association", links: ASSOCIATION_ITEMS },
        { title: "Nous rejoindre", links: [{ label: "Adhérer", href: "#adherer" }] },
      ],
      legalNavLabel: "Informations légales",
      legalLinks: LEGAL_LINKS,
      legalEntity: PLACEHOLDER_LEGAL_ENTITY,
    },
  },
};
