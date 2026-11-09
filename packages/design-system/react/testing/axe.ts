import axe from "axe-core";

/**
 * Runs axe-core on a rendered container and returns its violations as readable lines, so a failing
 * test shows what is wrong. Color contrast is off here: jsdom has no layout or painted colors. The
 * token tests check every color pair, and the e2e test runs the full axe check in Chromium.
 */
export async function axeViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    ({ id, help, nodes }) => `${id}: ${help} (${nodes.map(({ html }) => html).join(" | ")})`,
  );
}
