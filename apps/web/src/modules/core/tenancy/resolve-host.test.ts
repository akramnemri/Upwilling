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
  it("resolves production hosts in production only", () => {
    expect(resolveHost("upwilling.fr", "production")).toEqual({
      kind: "site",
      tenant: "upwilling",
    });
    expect(resolveHost("careerboost.upwilling.fr", "production")).toEqual({
      kind: "site",
      tenant: "careerboost",
    });
    expect(resolveHost("admin.upwilling.fr", "production")).toEqual({ kind: "admin" });
    expect(resolveHost("hooks.upwilling.fr", "production")).toEqual({ kind: "hooks" });
    expect(resolveHost("upwilling.fr", "local")).toBeNull();
  });

  it("refuses local hosts in production", () => {
    expect(resolveHost("upwilling.localhost", "production")).toBeNull();
  });

  it("refuses www in production (redirected by Caddy)", () => {
    expect(resolveHost("www.upwilling.fr", "production")).toBeNull();
  });

  it("refuses VLAB, which this project does not serve", () => {
    expect(resolveHost("vlab.upwilling.fr", "production")).toBeNull();
  });

  it("serves nothing on recette until its domain is configured (Task 1.4)", () => {
    expect(resolveHost("upwilling.localhost", "recette")).toBeNull();
    expect(resolveHost("upwilling.fr", "recette")).toBeNull();
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
