import {
  AnnouncementPill,
  Container,
  Eyebrow,
  Heading,
  Section,
  Stack,
  Text,
} from "@upwilling/design-system/react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getEnv } from "../../../../lib/env";
import { SITE_CHROME, SiteLayout } from "../../../../modules/content";
import { resolveHost } from "../../../../modules/core";

// Rendered per request: the tenant comes from the Host header, and at build time there is no
// DEPLOY_ENV to check.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Aperçu de la mise en page" };

/**
 * Page layout preview (Task 2.4b): the site's header, footer and one section per anchor of its
 * navigation, with synthetic copy, for the mobile and keyboard checks. The legal entity line is
 * still a placeholder, so this page exists on local and recette only; the route rules also refuse
 * /dev in production.
 */
export default async function SitePreviewPage() {
  const { DEPLOY_ENV } = getEnv();
  if (DEPLOY_ENV === "production") {
    notFound();
  }
  const target = resolveHost((await headers()).get("host"), DEPLOY_ENV);
  if (target?.kind !== "site") {
    notFound();
  }

  const chrome = SITE_CHROME[target.tenant];
  // Every anchor the header and the call to action point at gets its section.
  const anchors = [...chrome.items, ...(chrome.cta === null ? [] : [chrome.cta])].filter(
    (link, index, all) =>
      link.href.startsWith("#") && all.findIndex((other) => other.href === link.href) === index,
  );

  return (
    <SiteLayout tenant={target.tenant}>
      <Section spacing="lg" aria-labelledby="apercu">
        <Container>
          <Stack gap="4">
            <AnnouncementPill className="self-start">Aperçu · tâche 2.4b</AnnouncementPill>
            <Heading level={1} id="apercu" size="5xl">
              Aperçu de la mise en page
            </Heading>
            <Text size="lg" tone="muted">
              En-tête, pied de page et sections d’exemple. Sur un téléphone, le menu s’ouvre avec le
              bouton « Menu » ; Échap le referme. Les liens d’ancrage amènent chaque titre sous
              l’en-tête, sans qu’il soit masqué.
            </Text>
          </Stack>
        </Container>
      </Section>
      {anchors.map((anchor, index) => (
        <Section
          key={anchor.href}
          id={anchor.href.slice(1)}
          background={index % 2 === 0 ? "muted" : "surface"}
          aria-labelledby={`${anchor.href.slice(1)}-titre`}
        >
          <Container width="lg">
            <Stack gap="4">
              <Eyebrow>Section d’exemple</Eyebrow>
              <Heading level={2} id={`${anchor.href.slice(1)}-titre`}>
                {anchor.label}
              </Heading>
              <Text>
                Texte d’exemple pour donner de la hauteur à la section. Le contenu réel viendra des
                blocs du CMS (jalon 5) ; cette page sert seulement à vérifier l’en-tête, le pied de
                page et le défilement vers les ancres.
              </Text>
              <Text tone="muted">
                Deuxième paragraphe d’exemple, pour que chaque section occupe une bonne partie de
                l’écran sur mobile comme sur ordinateur.
              </Text>
            </Stack>
          </Container>
        </Section>
      ))}
    </SiteLayout>
  );
}
