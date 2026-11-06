import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { createLogger, REDACTED } from "./logger";

function captureLogger(level: "info" | "debug" = "info") {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString("utf8"));
      callback();
    },
  });
  const logger = createLogger({ level, destination });
  return {
    logger,
    output: () => lines.join(""),
    records: () => lines.map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

describe("logger", () => {
  it("writes structured JSON with level label, time, service and bound fields", () => {
    const { logger, records } = captureLogger();
    logger
      .child({ requestId: "req-1", operation: "test.op" })
      .info({ tenant: "careerboost" }, "done");

    const [record] = records();
    expect(record).toMatchObject({
      level: "info",
      service: "upwilling-web",
      requestId: "req-1",
      operation: "test.op",
      tenant: "careerboost",
      msg: "done",
    });
    expect(typeof record?.time).toBe("string");
  });

  it("redacts secrets, cookies, tokens and personal data at any of the first three levels", () => {
    const { logger, output } = captureLogger();
    logger.info(
      {
        password: "hunter2-top",
        token: "tok-top-secret",
        authorization: "Bearer abc.def.ghi",
        user: { email: "learner@example.test", phone: "+33600000000" },
        request: {
          headers: { cookie: "session=cookie-value-123", "set-cookie": "sid=set-cookie-456" },
        },
        stripe: { secret: "sk_test_fake_789" },
      },
      "sensitive payload",
    );

    const text = output();
    for (const leaked of [
      "hunter2-top",
      "tok-top-secret",
      "abc.def.ghi",
      "learner@example.test",
      "+33600000000",
      "cookie-value-123",
      "set-cookie-456",
      "sk_test_fake_789",
    ]) {
      expect(text).not.toContain(leaked);
    }
    expect(text).toContain(REDACTED);
  });

  it("scrubs email addresses from free-text messages", () => {
    const { logger, output } = captureLogger();
    logger.warn("sign-up refused for someone@example.test");
    expect(output()).not.toContain("someone@example.test");
    expect(output()).toContain(`sign-up refused for ${REDACTED}`);
  });

  it("respects the configured level", () => {
    const { logger, records } = captureLogger("info");
    logger.debug("hidden");
    logger.info("shown");
    expect(records().map((record) => record.msg)).toEqual(["shown"]);
  });
});
