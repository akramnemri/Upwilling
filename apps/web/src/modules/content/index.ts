// Public interface of the `content` module: other modules import from here only (01_ARCHITECTURE.md §7).
export { UnderConstructionPage } from "./components/UnderConstructionPage";
export { isIndexable, NO_INDEX_VALUE, X_ROBOTS_TAG_HEADER } from "./indexing";
export { buildSiteMetadata, siteOrigin } from "./site-metadata";
export { UNDER_CONSTRUCTION, type UnderConstructionContent } from "./under-construction";
