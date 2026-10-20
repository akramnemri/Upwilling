import { describe, expect, it } from "vitest";

import { normalizeHost, resolveHost } from "./resolve-host";

describe("resolveHost — local", () => {
  it.each([
    ["upwilling.localhost", { kind: "site", tenant: "upwilling" }],
    ["careerboost.localhost", { kind: "site", tenant: "careerboost" }],
    ["admin.localhost", { kind: "admin" }],
  ])("resolves %s", (host, expected) => {
    expect(resolveHost(host, "local")).toEqual(expected);
  });

  it("ignores the port", () => {
    expect(resolveHost("careerboost.localhost:3000", "local")).toEqual({
      kind: "site",
      tenant: "careerboost",
    });
  });

  it("is case-insensitive", () => {
    expect(resolveHost("UpWilling.LOCALHOST:3000", "local")).toEqual({
      kind: "site",
      tenant: "upwilling",
    });
  });

  it("accepts one trailing dot (fully qualified name)", () => {
    expect(resolveHost("upwilling.localhost.", "local")).toEqual({
      kind: "site",
      tenant: "upwilling",
    });
  });

  it.each([
    ["unknown host", "unknown.localhost"],
    ["bare localhost", "localhost:3000"],
    ["www prefix (Caddy redirects it before the app)", "www.upwilling.localhost"],
    ["suffix attack", "upwilling.localhost.evil.test"],
    ["prefix attack", "evilupwilling.localhost"],
    ["IPv4 address", "127.0.0.1:3000"],
    ["IPv6 address", "[::1]:3000"],
    ["userinfo", "attacker@upwilling.localhost"],
    ["path", "upwilling.localhost/admin"],
    ["non-numeric port", "upwilling.localhost:abc"],
    ["prototype key", "__proto__"],
    ["empty", ""],
  ])("refuses %s", (_label, host) => {
    expect(resolveHost(host, "local")).toBeNull();
  });

  it("refuses a missing Host header", () => {
    expect(resolveHost(null, "local")).toBeNull();
    expect(resolveHost(undefined, "local")).toBeNull();
  });
});

describe("resolveHost — environments are isolated", () => {
  const UPWILLING_SITE = { kind: "site", tenant: "upwilling" };
  const CAREERBOOST_SITE = { kind: "site", tenant: "careerboost" };

  it.each([
    ["production", "upwilling.fr", UPWILLING_SITE],
    ["production", "careerboost.upwilling.fr", CAREERBOOST_SITE],
    ["production", "admin.upwilling.fr", { kind: "admin" }],
    ["production", "hooks.upwilling.fr", { kind: "hooks" }],
    // Test-phase recette hosts (ADR-022).
    ["recette", "recette.upwilling.fr", UPWILLING_SITE],
    ["recette", "recette-careerboost.upwilling.fr", CAREERBOOST_SITE],
    ["recette", "recette-admin.upwilling.fr", { kind: "admin" }],
    ["recette", "recette-hooks.upwilling.fr", { kind: "hooks" }],
  ] as const)("%s: resolves %s", (deployEnv, host, expected) => {
    expect(resolveHost(host, deployEnv)).toEqual(expected);
  });

  it.each([
    ["production", "upwilling.localhost", "a local host"],
    ["production", "www.upwilling.fr", "www (redirected by Caddy)"],
    ["production", "vlab.upwilling.fr", "VLAB, which this project does not serve"],
    ["production", "recette.upwilling.fr", "a recette host"],
    ["production", "recette-admin.upwilling.fr", "a recette host"],
    ["local", "upwilling.fr", "a production host"],
    ["recette", "upwilling.fr", "a production host"],
    ["recette", "admin.upwilling.fr", "a production host"],
    ["recette", "upwilling.localhost", "a local host"],
    ["recette", "recette-stats.upwilling.fr", "the stats host (Caddy routes it to Umami)"],
  ] as const)("%s: refuses %s, %s", (deployEnv, host, _reason) => {
    expect(resolveHost(host, deployEnv)).toBeNull();
  });
});

describe("normalizeHost", () => {
  it("lowercases, strips the port and one trailing dot", () => {
    expect(normalizeHost("  Admin.LocalHost.:3000 ")).toBe("admin.localhost");
  });

  it("returns null for values that are not hostnames", () => {
    expect(normalizeHost("upwilling..localhost")).toBeNull();
    expect(normalizeHost("-upwilling.localhost")).toBeNull();
    expect(normalizeHost("upwilling.localhost:999999")).toBeNull();
  });
});
