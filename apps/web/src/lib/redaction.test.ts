import { describe, expect, it } from "vitest";

import { normalizeError } from "./errors";
import { REDACTED, scrubSensitiveText } from "./redaction";

describe("scrubSensitiveText", () => {
  it.each([
    ["key=value", "login failed password=hunter2 for user", "hunter2"],
    ["key: value", "token: abc123def", "abc123def"],
    ["quoted value", 'secret="very secret value"', "very secret value"],
    ["api key variants", "api_key=k1 apiKey=k2 api-key=k3", "k1"],
    ["bearer token", "Authorization header was Bearer eyJhbGciOi.payload.sig", "eyJhbGciOi"],
    ["URL credentials", "connect failed: postgres://app:S3cr3t@db.internal:5432/app", "S3cr3t"],
    ["email", "no account for someone@example.test", "someone@example.test"],
  ])("removes %s", (_label, text, secret) => {
    const scrubbed = scrubSensitiveText(text);
    expect(scrubbed).not.toContain(secret);
    expect(scrubbed).toContain(REDACTED);
  });

  it("keeps useful context around the secret", () => {
    expect(scrubSensitiveText("connect failed: postgres://app:S3cr3t@db.internal:5432/app")).toBe(
      `connect failed: postgres://${REDACTED}@db.internal:5432/app`,
    );
    expect(scrubSensitiveText("login failed password=hunter2 for user")).toBe(
      `login failed password=${REDACTED} for user`,
    );
  });

  it("leaves ordinary text alone", () => {
    expect(scrubSensitiveText("Session inter: 8 places restantes")).toBe(
      "Session inter: 8 places restantes",
    );
  });
});

describe("normalizeError scrubs messages, stacks and causes", () => {
  it("never carries a secret from an error message into the normalized error", () => {
    const cause = new Error("driver said postgres://app:S3cr3t@db:5432/app");
    const error = new Error("Deliberate test error: password=hunter2 token=fake-token-123", {
      cause,
    });
    const serialized = JSON.stringify(normalizeError(error));
    for (const secret of ["hunter2", "fake-token-123", "S3cr3t"]) {
      expect(serialized).not.toContain(secret);
    }
  });
});
