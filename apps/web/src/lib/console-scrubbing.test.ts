import { describe, expect, it } from "vitest";

import { installConsoleScrubbing } from "./console-scrubbing";

function fakeConsole() {
  const written: unknown[][] = [];
  const target = {
    error: (...args: unknown[]) => {
      written.push(args);
    },
    warn: (...args: unknown[]) => {
      written.push(args);
    },
  };
  installConsoleScrubbing(target);
  return { target, text: () => written.map((args) => args.map(String).join(" ")).join("\n") };
}

describe("installConsoleScrubbing", () => {
  it("scrubs secrets from Error objects printed by Next.js", () => {
    const { target, text } = fakeConsole();
    target.error(
      Object.assign(new Error("render failed: secret=fake-secret-456"), { digest: "123" }),
    );
    expect(text()).not.toContain("fake-secret-456");
    expect(text()).toContain("render failed");
    expect(text()).toContain("digest");
  });

  it("scrubs plain string arguments on error and warn", () => {
    const { target, text } = fakeConsole();
    target.error("⨯ token=abc123", "for someone@example.test");
    target.warn("Bearer eyJ.fake.jwt");
    for (const secret of ["abc123", "someone@example.test", "eyJ.fake.jwt"]) {
      expect(text()).not.toContain(secret);
    }
  });

  it("passes other values through", () => {
    const { target, text } = fakeConsole();
    target.warn(42, true);
    expect(text()).toBe("42 true");
  });
});
