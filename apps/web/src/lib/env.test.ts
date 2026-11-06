import { describe, expect, it } from "vitest";

import { EnvValidationError, parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a valid environment and applies defaults", () => {
    expect(parseEnv({ DEPLOY_ENV: "local" })).toEqual({
      DEPLOY_ENV: "local",
      LOG_LEVEL: "info",
      APP_VERSION: "local",
    });
  });

  it("ignores variables it does not know", () => {
    expect(parseEnv({ DEPLOY_ENV: "production", APP_ROLE: "cms", PATH: "/usr/bin" })).toEqual({
      DEPLOY_ENV: "production",
      LOG_LEVEL: "info",
      APP_ROLE: "cms",
      APP_VERSION: "local",
    });
  });

  it("treats an empty optional value as not set", () => {
    expect(parseEnv({ DEPLOY_ENV: "local", LOG_LEVEL: "" }).LOG_LEVEL).toBe("info");
  });

  it("rejects an unknown log level", () => {
    expect(() => parseEnv({ DEPLOY_ENV: "local", LOG_LEVEL: "verbose" })).toThrow(
      /LOG_LEVEL is invalid/,
    );
  });

  it("reports a missing variable by name", () => {
    expect(() => parseEnv({})).toThrow(EnvValidationError);
    expect(() => parseEnv({})).toThrow(/DEPLOY_ENV is missing/);
  });

  it("treats an empty value as missing", () => {
    expect(() => parseEnv({ DEPLOY_ENV: "" })).toThrow(/DEPLOY_ENV is missing/);
  });

  it("reports an invalid value with the allowed values", () => {
    expect(() => parseEnv({ DEPLOY_ENV: "staging" })).toThrow(
      /DEPLOY_ENV is invalid: expected one of "local", "recette", "production"/,
    );
  });

  it("never echoes the rejected value, which could be a secret", () => {
    const secretLookingValue = "sk_live_should_never_appear";
    try {
      parseEnv({ DEPLOY_ENV: secretLookingValue });
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      if (!(error instanceof EnvValidationError)) {
        throw error;
      }
      expect(error.message).not.toContain(secretLookingValue);
    }
  });
});

describe("parseEnv — container role (APP_ROLE, SITE)", () => {
  it("allows no role locally: one process serves every host (pnpm dev, e2e)", () => {
    expect(parseEnv({ DEPLOY_ENV: "local" }).APP_ROLE).toBeUndefined();
  });

  it.each(["recette", "production"])("requires a role when DEPLOY_ENV is %s", (deployEnv) => {
    expect(() => parseEnv({ DEPLOY_ENV: deployEnv })).toThrow(
      /APP_ROLE is missing \(required when DEPLOY_ENV is recette or production\)/,
    );
  });

  it("accepts each role with the variables it needs", () => {
    expect(
      parseEnv({ DEPLOY_ENV: "production", APP_ROLE: "web", SITE: "upwilling" }),
    ).toMatchObject({
      APP_ROLE: "web",
      SITE: "upwilling",
    });
    expect(parseEnv({ DEPLOY_ENV: "recette", APP_ROLE: "worker" }).APP_ROLE).toBe("worker");
  });

  it("requires SITE for the web role", () => {
    expect(() => parseEnv({ DEPLOY_ENV: "production", APP_ROLE: "web" })).toThrow(
      /SITE is missing \(required when APP_ROLE is web\)/,
    );
  });

  it("refuses SITE for other roles, where it would be misleading", () => {
    expect(() =>
      parseEnv({ DEPLOY_ENV: "production", APP_ROLE: "cms", SITE: "upwilling" }),
    ).toThrow(/SITE is invalid: only allowed when APP_ROLE is web/);
    expect(() => parseEnv({ DEPLOY_ENV: "local", SITE: "upwilling" })).toThrow(/SITE is invalid/);
  });

  it("refuses unknown roles and sites with the allowed values", () => {
    expect(() => parseEnv({ DEPLOY_ENV: "local", APP_ROLE: "admin" })).toThrow(
      /APP_ROLE is invalid: expected one of "web", "cms", "worker"/,
    );
    expect(() => parseEnv({ DEPLOY_ENV: "local", APP_ROLE: "web", SITE: "vlab" })).toThrow(
      /SITE is invalid: expected one of "upwilling", "careerboost"/,
    );
  });
});

describe("parseEnv — APP_VERSION (baked into the image, Task 1.5)", () => {
  it("accepts a full commit SHA", () => {
    const sha = "0123456789abcdef0123456789abcdef01234567";
    expect(parseEnv({ DEPLOY_ENV: "recette", APP_ROLE: "cms", APP_VERSION: sha }).APP_VERSION).toBe(
      sha,
    );
  });

  it("refuses anything else, so /api/version never echoes an arbitrary value", () => {
    expect(() => parseEnv({ DEPLOY_ENV: "local", APP_VERSION: "0123abc" })).toThrow(
      /APP_VERSION is invalid: must be a full commit SHA or local/,
    );
    expect(() => parseEnv({ DEPLOY_ENV: "local", APP_VERSION: "<script>" })).toThrow(
      /APP_VERSION is invalid/,
    );
  });
});
