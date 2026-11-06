import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { TENANT_SLUGS, type HostTarget } from "../core";
import { isIndexable } from "./indexing";
import { buildSiteMetadata, siteOrigin } from "./site-metadata";
import { UNDER_CONSTRUCTION } from "./under-construction";

const UPWILLING: HostTarget = { kind: "site", tenant: "upwilling" };
const CAREERBOOST: HostTarget = { kind: "site", tenant: "careerboost" };
const ADMIN: HostTarget = { kind: "admin" };
const PUBLIC_DIR = join(import.meta.dirname, "../../../public");

describe("isIndexable", () => {
  it("allows indexing only for a public site in production", () => {
    expect(isIndexable(UPWILLING, "production")).toBe(true);
    expect(isIndexable(CAREERBOOST, "production")).toBe(true);
  });

  it("refuses recette and local, whatever the host", () => {
    for (const deployEnv of ["recette", "local"] as const) {
      expect(isIndexable(UPWILLING, deployEnv)).toBe(false);
      expect(isIndexable(CAREERBOOST, deployEnv)).toBe(false);
    }
  });

  it("refuses the admin and hooks hosts and unknown hosts, even in production", () => {
    expect(isIndexable(ADMIN, "production")).toBe(false);
    expect(isIndexable({ kind: "hooks" }, "production")).toBe(false);
    expect(isIndexable(null, "production")).toBe(false);
  });
});

describe("buildSiteMetadata", () => {
  it("uses the brand of the host for title, description and Open Graph", () => {
    const metadata = buildSiteMetadata({
      target: CAREERBOOST,
      rawHost: "careerboost.localhost:3000",
      deployEnv: "local",
    });
    expect(metadata.title).toBe("UpWilling Career Boost — Association");
    expect(metadata.description).toBe(UNDER_CONSTRUCTION.careerboost.description);
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "fr_FR",
      siteName: "UpWilling Career Boost",
    });
    expect(metadata.metadataBase?.toString()).toBe("http://careerboost.localhost:3000/");
  });

  it("never mixes brands: the academy host gets the academy title", () => {
    const metadata = buildSiteMetadata({
      target: UPWILLING,
      rawHost: "upwilling.localhost:3000",
      deployEnv: "local",
    });
    expect(metadata.title).toBe("UpWilling — Centre de formation");
    expect(JSON.stringify(metadata)).not.toContain("Career Boost");
  });

  it("is noindex outside production and indexable in production", () => {
    const local = buildSiteMetadata({
      target: UPWILLING,
      rawHost: "upwilling.localhost",
      deployEnv: "local",
    });
    const recette = buildSiteMetadata({
      target: UPWILLING,
      rawHost: "upwilling.fr",
      deployEnv: "recette",
    });
    const production = buildSiteMetadata({
      target: UPWILLING,
      rawHost: "upwilling.fr",
      deployEnv: "production",
    });
    expect(local.robots).toEqual({ index: false, follow: false });
    expect(recette.robots).toEqual({ index: false, follow: false });
    expect(production.robots).toEqual({ index: true, follow: true });
  });

  it("keeps the admin host out of search engines, even in production", () => {
    const metadata = buildSiteMetadata({
      target: ADMIN,
      rawHost: "admin.upwilling.fr",
      deployEnv: "production",
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("siteOrigin", () => {
  it("keeps the port locally and uses HTTPS without port elsewhere", () => {
    expect(siteOrigin("upwilling.localhost:3100", "local")).toBe("http://upwilling.localhost:3100");
    expect(siteOrigin("upwilling.localhost", "local")).toBe("http://upwilling.localhost");
    expect(siteOrigin("careerboost.upwilling.fr", "production")).toBe(
      "https://careerboost.upwilling.fr",
    );
  });

  it("returns null for a host that is not a plain hostname", () => {
    expect(siteOrigin(null, "local")).toBeNull();
    expect(siteOrigin("evil.example/path", "production")).toBeNull();
  });
});

describe("UNDER_CONSTRUCTION content", () => {
  for (const tenant of TENANT_SLUGS) {
    const content = UNDER_CONSTRUCTION[tenant];

    it(`${tenant}: every referenced file exists in public/`, () => {
      const files = [content.icon.src, content.appleIcon, content.logo?.src, content.ogImage?.src];
      for (const file of files.filter((value) => value !== null && value !== undefined)) {
        expect(existsSync(join(PUBLIC_DIR, file)), file).toBe(true);
      }
    });

    it(`${tenant}: the contact address is either missing or an organization address`, () => {
      // Until the PO gives it, the page says "bientôt disponible". Never a personal address.
      if (content.contactEmail !== null) {
        expect(content.contactEmail).toMatch(/^[a-z0-9.-]+@upwilling\.fr$/);
      }
    });
  }
});
