import type { TenantSlug } from "../core";

/**
 * Content of the temporary "under construction" page of each site (Task 1.2, TR-13).
 * French copy: drafts based on the brand's own visuals (2026-10-19), to be validated by the PO.
 */
export interface UnderConstructionContent {
  siteName: string;
  /** `<title>` and Open Graph title. */
  metaTitle: string;
  /** Meta description and Open Graph description. */
  description: string;
  headline: string;
  tagline: string;
  message: string;
  /**
   * Public contact address of the organization, given by the PO. Null until then: the page says so.
   * Never a personal address, never one taken from a personal profile.
   */
  contactEmail: string | null;
  /** Null when the PO has not sent the logo yet: the page shows the site name as a text wordmark. */
  logo: { src: string; width: number; height: number } | null;
  icon: { src: string; type: string };
  appleIcon: string | null;
  /** Open Graph image (relative to the site origin). */
  ogImage: { src: string; width: number; height: number } | null;
}

export const UNDER_CONSTRUCTION: Readonly<Record<TenantSlug, UnderConstructionContent>> = {
  upwilling: {
    siteName: "UpWilling",
    metaTitle: "UpWilling — Centre de formation",
    description: "Le nouveau site du centre de formation UpWilling arrive bientôt.",
    headline: "Notre nouveau site arrive bientôt.",
    tagline: "Apprendre. Évoluer. Réussir.",
    message:
      "Le centre de formation UpWilling prépare son nouveau site. Revenez très vite pour découvrir nos formations.",
    contactEmail: null,
    // The academy logo files are not available yet (PO, 04_DESIGN_SYSTEM.md §7).
    logo: null,
    icon: { src: "/brands/upwilling/icon.svg", type: "image/svg+xml" },
    appleIcon: null,
    ogImage: null,
  },
  careerboost: {
    siteName: "UpWilling Career Boost",
    metaTitle: "UpWilling Career Boost — Association",
    description:
      "Investir en vous aujourd’hui, construire la vie que vous voulez demain. Le site de l’association arrive bientôt.",
    headline: "Investir en vous aujourd’hui, construire la vie que vous voulez demain.",
    tagline: "Apprendre. Évoluer. Réussir.",
    message:
      "Le site de l’association UpWilling Career Boost est en construction. Votre avenir commence maintenant.",
    contactEmail: null,
    logo: { src: "/brands/careerboost/logo.webp", width: 480, height: 404 },
    icon: { src: "/brands/careerboost/icon.png", type: "image/png" },
    appleIcon: "/brands/careerboost/apple-icon.png",
    ogImage: { src: "/brands/careerboost/og.png", width: 1200, height: 630 },
  },
};
