import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { fr } from "@payloadcms/translations/languages/fr";
import { buildConfig } from "payload";
import sharp from "sharp";

import { getPayloadSettings } from "./lib/payload-settings";
import { Media } from "./modules/content/payload";
import { Users } from "./modules/core/payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const settings = getPayloadSettings();
const mediaUpload = typeof Media.upload === "object" ? Media.upload : {};

/**
 * Payload CMS (Task 3.1). One configuration for the whole application; collections live in their module
 * (02_CODING_STANDARDS.md §3) and are only listed here. The admin is served on the admin host only
 * (core `resolveRoute`).
 */
export default buildConfig({
  secret: settings.secret,
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " — UpWilling" },
  },
  // Admin interface in French only.
  i18n: {
    fallbackLanguage: "fr",
    supportedLanguages: { fr },
  },
  // ADR-014: French by default, English declared for TR-10 but not used yet. Fields opt in with
  // `localized: true`; a read without a locale gets French.
  localization: {
    locales: [
      { code: "fr", label: "Français" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "fr",
    fallback: true,
  },
  collections: [
    Users,
    // The upload folder depends on the environment, so it is set here rather than in the module.
    { ...Media, upload: { ...mediaUpload, staticDir: settings.mediaDir } },
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: settings.databaseUrl },
    // Migrations are the only way the schema changes, locally too (01_ARCHITECTURE.md §9): Payload's dev
    // "push" is off, so a local database never drifts from what CI and the servers run, and `migrate`
    // never stops on Payload's "database was changed in dev mode" prompt. After a schema change:
    // `pnpm migrate:create <name>` then `pnpm migrate`.
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  upload: {
    limits: { fileSize: 10 * 1024 * 1024 },
  },
  sharp,
  plugins: [
    // ADR-008: media on R2's public bucket once the Cloudflare account exists; MEDIA_DIR until then.
    s3Storage({
      enabled: settings.r2 !== undefined,
      // Same database schema with and without R2, so one set of migrations fits every environment.
      alwaysInsertFields: true,
      collections: { [Media.slug]: true },
      bucket: settings.r2?.publicBucket ?? "",
      config: {
        endpoint: settings.r2?.endpoint ?? "",
        region: "auto",
        credentials: {
          accessKeyId: settings.r2?.accessKeyId ?? "",
          secretAccessKey: settings.r2?.secretAccessKey ?? "",
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  // REST and the Local API are enough; GraphQL would only add an endpoint and a schema to expose.
  graphQL: { disable: true },
  telemetry: false,
});
