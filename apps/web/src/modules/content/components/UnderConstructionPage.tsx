import Image from "next/image";

import type { UnderConstructionContent } from "../under-construction";
import styles from "./UnderConstructionPage.module.css";

/** Temporary branded page of a public site (Task 1.2, TR-13). Colors come from the `--uw-*` variables. */
export function UnderConstructionPage({ content }: { content: UnderConstructionContent }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {content.logo === null ? (
          <p className={styles.wordmark}>{content.siteName}</p>
        ) : (
          <Image
            className={styles.logo}
            src={content.logo.src}
            width={content.logo.width}
            height={content.logo.height}
            alt={content.siteName}
            priority
            // Already sized and compressed: no runtime image optimization (and no sharp) needed.
            unoptimized
          />
        )}
        <p className={styles.badge}>Site en construction</p>
        <h1 className={styles.headline}>{content.headline}</h1>
        <p className={styles.tagline}>{content.tagline}</p>
        <p className={styles.message}>{content.message}</p>
        <p className={styles.contact}>
          {content.contactEmail === null ? (
            "Adresse de contact bientôt disponible."
          ) : (
            <>
              Contact : <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
