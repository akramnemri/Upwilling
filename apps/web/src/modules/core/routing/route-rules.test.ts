import { describe, expect, it } from "vitest";

import type { DeployEnv } from "../../../lib/env";
import {
  normalizePathForRules,
  resolveRoute,
  roleFromEnv,
  type AppRole,
  type RouteDecision,
} from "./route-rules";

const WEB_UPWILLING: AppRole = { kind: "web", site: "upwilling" };
const WEB_CAREERBOOST: AppRole = { kind: "web", site: "careerboost" };
const CMS: AppRole = { kind: "cms" };
const WORKER: AppRole = { kind: "worker" };
const ALL: AppRole = { kind: "all" };

type Row = [label: string, role: AppRole, host: string, path: string, expected: RouteDecision];

function decide(role: AppRole, host: string, path: string, deployEnv: DeployEnv = "production") {
  return resolveRoute({ role, rawHost: host, pathname: path, deployEnv });
}

describe("resolveRoute — production role/host matrix", () => {
  const rows: Row[] = [
    // web-upwilling: only its own host, no admin, no unlisted API.
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/", "allow"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/formations/exemple", "allow"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/ready", "allow"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/version", "allow"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/version/x", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "careerboost.upwilling.fr", "/", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "admin.upwilling.fr", "/", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "admin.upwilling.fr", "/admin", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "hooks.upwilling.fr", "/api/webhooks/stripe", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/admin", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/admin/collections/users", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/users", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/graphql", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/webhooks/stripe", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/api/dev/test-error", "not_found"],
    // web-careerboost mirrors it.
    ["web-careerboost", WEB_CAREERBOOST, "careerboost.upwilling.fr", "/", "allow"],
    ["web-careerboost", WEB_CAREERBOOST, "upwilling.fr", "/", "not_found"],
    ["web-careerboost", WEB_CAREERBOOST, "careerboost.upwilling.fr", "/admin", "not_found"],
    // cms: admin and hooks hosts only; hooks host only for webhooks.
    ["cms", CMS, "admin.upwilling.fr", "/", "allow"],
    ["cms", CMS, "admin.upwilling.fr", "/admin", "allow"],
    ["cms", CMS, "admin.upwilling.fr", "/api/users", "allow"],
    ["cms", CMS, "admin.upwilling.fr", "/api/ready", "allow"],
    ["cms", CMS, "hooks.upwilling.fr", "/api/webhooks/stripe", "allow"],
    ["cms", CMS, "hooks.upwilling.fr", "/api/webhooks", "allow"],
    ["cms", CMS, "hooks.upwilling.fr", "/", "not_found"],
    ["cms", CMS, "hooks.upwilling.fr", "/admin", "not_found"],
    ["cms", CMS, "hooks.upwilling.fr", "/api/users", "not_found"],
    ["cms", CMS, "hooks.upwilling.fr", "/api/version", "not_found"],
    ["cms", CMS, "hooks.upwilling.fr", "/api/webhooks-fake", "not_found"],
    ["cms", CMS, "upwilling.fr", "/", "not_found"],
    ["cms", CMS, "careerboost.upwilling.fr", "/", "not_found"],
    // worker: serves nothing.
    ["worker", WORKER, "upwilling.fr", "/", "not_found"],
    ["worker", WORKER, "admin.upwilling.fr", "/admin", "not_found"],
    // unknown hosts: refused whatever the role.
    ["web-upwilling", WEB_UPWILLING, "www.upwilling.fr", "/", "not_found"],
    ["cms", CMS, "evil.example.test", "/admin", "not_found"],
    // "all" is a local-only role: in production it serves nothing.
    ["all", ALL, "upwilling.fr", "/", "not_found"],
    ["all", ALL, "admin.upwilling.fr", "/admin", "not_found"],
  ];

  it.each(rows)("%s: %s%s → %s", (_label, role, host, path, expected) => {
    expect(decide(role, host, path)).toBe(expected);
  });
});

describe("resolveRoute — recette role/host matrix (test-phase hosts, ADR-022)", () => {
  const rows: Row[] = [
    ["web-upwilling", WEB_UPWILLING, "recette.upwilling.fr", "/", "allow"],
    ["web-upwilling", WEB_UPWILLING, "recette-careerboost.upwilling.fr", "/", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "recette.upwilling.fr", "/admin", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "upwilling.fr", "/", "not_found"],
    ["web-careerboost", WEB_CAREERBOOST, "recette-careerboost.upwilling.fr", "/", "allow"],
    ["web-careerboost", WEB_CAREERBOOST, "recette.upwilling.fr", "/", "not_found"],
    ["cms", CMS, "recette-admin.upwilling.fr", "/admin", "allow"],
    ["cms", CMS, "recette-hooks.upwilling.fr", "/api/webhooks/stripe", "allow"],
    ["cms", CMS, "recette-hooks.upwilling.fr", "/admin", "not_found"],
    ["cms", CMS, "admin.upwilling.fr", "/admin", "not_found"],
    ["web-upwilling", WEB_UPWILLING, "recette.upwilling.fr", "/api/dev/test-error", "not_found"],
  ];

  it.each(rows)("%s: %s%s → %s", (_label, role, host, path, expected) => {
    expect(decide(role, host, path, "recette")).toBe(expected);
  });
});

describe("resolveRoute — liveness", () => {
  it.each([WEB_UPWILLING, CMS, WORKER, ALL])(
    "serves /api/health on any host for role %o",
    (role) => {
      expect(decide(role, "localhost", "/api/health")).toBe("allow");
      expect(decide(role, "unknown.example.test", "/api/health")).toBe("allow");
    },
  );

  it("does not extend that exception to lookalike paths", () => {
    expect(decide(CMS, "localhost", "/api/health/extra")).toBe("not_found");
    expect(decide(CMS, "localhost", "/api/ready")).toBe("not_found");
  });
});

describe("resolveRoute — path tricks cannot bypass the rules", () => {
  it.each([
    "/ADMIN",
    "/Admin/collections",
    "/%61dmin",
    "//admin",
    "/admin/",
    "/API/users",
    "/%61pi/users",
    "//api//users",
  ])("refuses %s on a public host", (path) => {
    expect(decide(WEB_UPWILLING, "upwilling.fr", path)).toBe("not_found");
  });

  it("refuses malformed percent-encoding instead of guessing", () => {
    expect(decide(WEB_UPWILLING, "upwilling.fr", "/%E0%A4%A")).toBe("not_found");
    expect(normalizePathForRules("/%E0%A4%A")).toBeNull();
  });

  it("keeps the webhook allowlist exact on the hooks host", () => {
    expect(decide(CMS, "hooks.upwilling.fr", "/API/WEBHOOKS/stripe")).toBe("allow");
    expect(decide(CMS, "hooks.upwilling.fr", "/api/webhooks/..%2fusers")).toBe("not_found");
    expect(decide(CMS, "hooks.upwilling.fr", "/api/webhooks/%2e%2e/users")).toBe("not_found");
  });
});

describe("resolveRoute — local development", () => {
  it("serves every local host in the local-only 'all' role, with the same path rules", () => {
    expect(decide(ALL, "upwilling.localhost:3000", "/", "local")).toBe("allow");
    expect(decide(ALL, "careerboost.localhost:3000", "/", "local")).toBe("allow");
    expect(decide(ALL, "admin.localhost:3000", "/admin", "local")).toBe("allow");
    expect(decide(ALL, "upwilling.localhost:3000", "/admin", "local")).toBe("not_found");
    expect(decide(ALL, "upwilling.localhost:3000", "/api/users", "local")).toBe("not_found");
    expect(decide(ALL, "unknown.localhost:3000", "/", "local")).toBe("not_found");
    expect(decide(ALL, "localhost:3000", "/", "local")).toBe("not_found");
  });

  it("exposes the dev test routes on public hosts only locally", () => {
    expect(decide(ALL, "upwilling.localhost:3000", "/api/dev/test-error", "local")).toBe("allow");
    expect(decide(WEB_UPWILLING, "upwilling.fr", "/api/dev/test-error", "production")).toBe(
      "not_found",
    );
  });

  it("applies role rules locally too (as in the local role-test containers)", () => {
    expect(decide(WEB_UPWILLING, "upwilling.localhost:3001", "/", "local")).toBe("allow");
    expect(decide(WEB_UPWILLING, "careerboost.localhost:3001", "/", "local")).toBe("not_found");
    expect(decide(CMS, "admin.localhost:3002", "/", "local")).toBe("allow");
    expect(decide(CMS, "upwilling.localhost:3002", "/", "local")).toBe("not_found");
  });
});

describe("roleFromEnv", () => {
  it("maps each validated configuration to its role", () => {
    expect(roleFromEnv({})).toEqual({ kind: "all" });
    expect(roleFromEnv({ APP_ROLE: "web", SITE: "careerboost" })).toEqual({
      kind: "web",
      site: "careerboost",
    });
    expect(roleFromEnv({ APP_ROLE: "cms" })).toEqual({ kind: "cms" });
    expect(roleFromEnv({ APP_ROLE: "worker" })).toEqual({ kind: "worker" });
  });

  it("refuses a web role without a site rather than guessing one", () => {
    expect(() => roleFromEnv({ APP_ROLE: "web" })).toThrow(/requires SITE/);
  });
});
