import "../css/tailwind.css";
import "./preview.css";

import type { Decorator, Preview } from "@storybook/nextjs-vite";

const BRANDS = ["upwilling", "careerboost"] as const;
type Brand = (typeof BRANDS)[number];

function isBrand(value: unknown): value is Brand {
  return BRANDS.some((brand) => brand === value);
}

// The application sets `data-brand` on `<html>` from the request host; the toolbar does the same
// here, so every story (and the dialog's top layer, the page background) uses the chosen brand. Set
// before the story renders: the color tokens exist only under `[data-brand]`, so the first paint is
// already themed (screenshots in Task 2.3b depend on it).
const withBrand: Decorator = (Story, context) => {
  const brand: Brand = isBrand(context.globals["brand"]) ? context.globals["brand"] : "upwilling";
  document.documentElement.dataset["brand"] = brand;
  return <Story />;
};

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    brand: {
      description: "Marque (attribut data-brand)",
      toolbar: {
        title: "Marque",
        icon: "paintbrush",
        items: [
          { value: "upwilling", title: "UpWilling (académie)" },
          { value: "careerboost", title: "Career Boost (association)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    brand: "upwilling",
  },
  decorators: [withBrand],
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
    a11y: {
      // Same rule set as the e2e check (WCAG 2.2 AA). "todo": violations show in the panel as
      // warnings; nothing runs them in CI yet (visual regression is Task 2.3b).
      options: {
        runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      test: "todo",
    },
    controls: {
      expanded: true,
    },
  },
};

export default preview;
