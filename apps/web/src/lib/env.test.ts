import { describe, expect, it } from "vitest";

import { EnvValidationError, parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a valid environment and applies defaults", () => {
    expect(parseEnv({ DEPLOY_ENV: "local" })).toEqual({ DEPLOY_ENV: "local", LOG_LEVEL: "info" });
  });

  it("ignores variables it does not know", () => {
    expect(parseEnv({ DEPLOY_ENV: "production", PATH: "/usr/bin" })).toEqual({
      DEPLOY_ENV: "production",
      LOG_LEVEL: "info",
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
