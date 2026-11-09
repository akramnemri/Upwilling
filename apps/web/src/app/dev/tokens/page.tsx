import {
  BASE_TOKENS,
  BRAND_TOKENS,
  type BrandTokens,
  COLOR_ROLES,
  colorRoleVariable,
  CONTRAST_PAIRS,
  contrastRatio,
  PALETTES,
  paletteStepVariable,
} from "@upwilling/design-system";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { getEnv } from "../../../lib/env";
import { brandForHost } from "../../../modules/content";
import { resolveHost } from "../../../modules/core";
import styles from "./page.module.css";

// Rendered per request: the brand comes from the Host header, and at build time there is no DEPLOY_ENV.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Aperçu des jetons de design" };

const TYPE_SAMPLE = "Apprendre. Évoluer. Réussir.";

/**
 * Token preview (Task 2.1a): every color role, palette, contrast pair and base token of the brand of
 * the current host. Local and recette only; the route rules also refuse /dev in production.
 */
export default async function TokenPreviewPage() {
  const { DEPLOY_ENV } = getEnv();
  if (DEPLOY_ENV === "production") {
    notFound();
  }
  const brand = brandForHost(resolveHost((await headers()).get("host"), DEPLOY_ENV));
  const tokens = BRAND_TOKENS[brand];

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Aperçu des jetons de design</h1>
        <p>
          Marque affichée : <strong data-testid="brand">{brand}</strong> (déduite de l’adresse du
          site). Ouvrez l’autre site pour comparer. Page de développement, absente en production.
        </p>
      </header>
      <ColorRoles tokens={tokens} />
      <Palettes tokens={tokens} />
      <ContrastPairs tokens={tokens} />
      <BaseTokens />
    </main>
  );
}

function ColorRoles({ tokens }: Readonly<{ tokens: BrandTokens }>) {
  return (
    <section className={styles.section} aria-labelledby="roles">
      <h2 id="roles">Rôles de couleur</h2>
      <ul className={styles.grid}>
        {COLOR_ROLES.map((role) => (
          <li key={role} className={styles.card}>
            <span className={styles.swatch} style={background(colorRoleVariable(role))} />
            <code>{colorRoleVariable(role)}</code>
            <span className={styles.meta}>
              <span data-testid={`role-${role}`}>{tokens.colors[role]}</span> ·{" "}
              {tokens.colorOrigins[role]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Palettes({ tokens }: Readonly<{ tokens: BrandTokens }>) {
  return (
    <section className={styles.section} aria-labelledby="palettes">
      <h2 id="palettes">Palettes (aperçus et teintes, jamais du texte)</h2>
      {PALETTES.map((palette) => (
        <div key={palette} className={styles.palette}>
          <h3 className={styles.paletteName}>
            {palette} <span className={styles.meta}>source {tokens.palettes[palette].source}</span>
          </h3>
          <ol className={styles.steps}>
            {Object.entries(tokens.palettes[palette].steps).map(([step, hex]) => (
              <li key={step} className={styles.step}>
                <span
                  className={styles.swatch}
                  style={background(paletteStepVariable(palette, step))}
                />
                <span>{step}</span>
                <span className={styles.meta}>{hex}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function ContrastPairs({ tokens }: Readonly<{ tokens: BrandTokens }>) {
  return (
    <section className={styles.section} aria-labelledby="contrast">
      <h2 id="contrast">Contrastes (WCAG AA : 4,5 pour le texte, 3 pour les composants)</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Premier plan</th>
              <th scope="col">Arrière-plan</th>
              <th scope="col">Exemple</th>
              <th scope="col">Ratio</th>
              <th scope="col">Minimum</th>
            </tr>
          </thead>
          <tbody>
            {CONTRAST_PAIRS.map(({ foreground, background: back, min }) => {
              const ratio = contrastRatio(tokens.colors[foreground], tokens.colors[back]);
              return (
                <tr key={`${foreground}/${back}`}>
                  <td>
                    <code>{foreground}</code>
                  </td>
                  <td>
                    <code>{back}</code>
                  </td>
                  <td>
                    <span
                      className={styles.sample}
                      style={{
                        color: `var(${colorRoleVariable(foreground)})`,
                        background: `var(${colorRoleVariable(back)})`,
                      }}
                    >
                      Aa
                    </span>
                  </td>
                  <td>{ratio.toFixed(2)}</td>
                  <td>
                    {min} {ratio >= min ? "✔" : "✘ insuffisant"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BaseTokens() {
  return (
    <section className={styles.section} aria-labelledby="base">
      <h2 id="base">Typographie, espacements, rayons, ombres</h2>
      <ul className={styles.list}>
        {Object.entries(BASE_TOKENS["font-size"] ?? {}).map(([variable, value]) => (
          <li key={variable}>
            <p className={styles.typeSample} style={{ fontSize: `var(${variable})` }}>
              {TYPE_SAMPLE}
            </p>
            <code>{variable}</code> <span className={styles.meta}>{value}</span>
          </li>
        ))}
      </ul>
      <ul className={styles.list}>
        {Object.entries(BASE_TOKENS.space ?? {}).map(([variable, value]) => (
          <li key={variable} className={styles.spaceRow}>
            <span className={styles.spaceBar} style={{ width: `var(${variable})` }} />
            <code>{variable}</code> <span className={styles.meta}>{value}</span>
          </li>
        ))}
      </ul>
      <ul className={styles.grid}>
        {Object.entries(BASE_TOKENS.radius ?? {}).map(([variable, value]) => (
          <li key={variable} className={styles.card}>
            <span className={styles.shape} style={{ borderRadius: `var(${variable})` }} />
            <code>{variable}</code>
            <span className={styles.meta}>{value}</span>
          </li>
        ))}
        {Object.entries(BASE_TOKENS.shadow ?? {}).map(([variable]) => (
          <li key={variable} className={styles.card}>
            <span className={styles.shape} style={{ boxShadow: `var(${variable})` }} />
            <code>{variable}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function background(variable: string): CSSProperties {
  return { background: `var(${variable})` };
}
