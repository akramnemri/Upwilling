// Public interface of the `content` module: other modules import from here only (01_ARCHITECTURE.md §7).
export { brandForHost } from "./brand";
export { SiteLayout } from "./components/SiteLayout";
export { UnderConstructionPage } from "./components/UnderConstructionPage";
export { isIndexable, NO_INDEX_VALUE, X_ROBOTS_TAG_HEADER } from "./indexing";
export { PLACEHOLDER_LEGAL_ENTITY, SITE_CHROME, type SiteChromeContent } from "./site-chrome";
export { buildSiteMetadata, siteOrigin } from "./site-metadata";
export { UNDER_CONSTRUCTION, type UnderConstructionContent } from "./under-construction";
