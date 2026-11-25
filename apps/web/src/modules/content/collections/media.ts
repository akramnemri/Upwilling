import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../../core";

/**
 * Public images and files (logos, photos, illustrations). Stored on R2's public bucket when configured,
 * in MEDIA_DIR otherwise (ADR-008). Private files (invoices, CVs, course materials) never go here:
 * they get their own collection on the private bucket.
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Média", plural: "Médias" },
  admin: {
    description: "Images et fichiers publics, visibles par tous les visiteurs des sites.",
  },
  access: {
    // Public by nature: these files are shown on the public sites.
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    // Images and PDFs only; other types are refused at upload.
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      label: "Texte alternatif",
      type: "text",
      required: true,
      // Localized (ADR-014): the alternative text is page content and will need an English version.
      localized: true,
      admin: {
        description: "Décrit l'image pour les personnes qui ne la voient pas (accessibilité).",
      },
    },
  ],
};
