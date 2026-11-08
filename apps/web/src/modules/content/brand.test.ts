import { describe, expect, it } from "vitest";

import { resolveHost } from "../core";
import { brandForHost } from "./brand";

describe("brandForHost", () => {
  it("gives each site host its own brand", () => {
    expect(brandForHost(resolveHost("upwilling.fr", "production"))).toBe("upwilling");
    expect(brandForHost(resolveHost("careerboost.upwilling.fr", "production"))).toBe("careerboost");
    expect(brandForHost(resolveHost("recette-careerboost.upwilling.fr", "recette"))).toBe(
      "careerboost",
    );
  });

  it("uses the academy theme on the admin and hooks hosts and on unknown hosts", () => {
    expect(brandForHost(resolveHost("admin.upwilling.fr", "production"))).toBe("upwilling");
    expect(brandForHost(resolveHost("hooks.upwilling.fr", "production"))).toBe("upwilling");
    expect(brandForHost(null)).toBe("upwilling");
  });
});
