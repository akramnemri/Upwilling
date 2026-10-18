import { describe, expect, it } from "vitest";

import { AppError, GENERIC_ERROR_MESSAGE, normalizeError, toErrorResponse } from "./errors";

describe("AppError", () => {
  it("carries a stable code, a safe message, a status and internal context", () => {
    const error = new AppError("SERVICE_UNAVAILABLE", "Paiement momentanément indisponible.", {
      status: 503,
      context: { provider: "stripe" },
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.message).toBe("Paiement momentanément indisponible.");
    expect(error.status).toBe(503);
    expect(error.context).toEqual({ provider: "stripe" });
  });

  it("defaults to status 500 and empty context", () => {
    const error = new AppError("INTERNAL_ERROR", "Erreur.");
    expect(error.status).toBe(500);
    expect(error.context).toEqual({});
  });
});

describe("toErrorResponse", () => {
  it("exposes an AppError's code, message and status with the request ID", () => {
    const error = new AppError("NOT_FOUND", "Ressource introuvable.", {
      status: 404,
      context: { internalId: 42 },
    });
    expect(toErrorResponse(error, "req-1")).toEqual({
      status: 404,
      body: { error: { code: "NOT_FOUND", message: "Ressource introuvable.", requestId: "req-1" } },
    });
  });

  it("never exposes an AppError's internal context", () => {
    const error = new AppError("BAD_REQUEST", "Requête invalide.", {
      status: 400,
      context: { sql: "SELECT * FROM users" },
    });
    expect(JSON.stringify(toErrorResponse(error, "req-2"))).not.toContain("SELECT");
  });

  it("hides unexpected errors behind a generic French message", () => {
    const error = new Error("connect ECONNREFUSED 10.0.0.5:5432 password=hunter2");
    const response = toErrorResponse(error, "req-3");
    expect(response).toEqual({
      status: 500,
      body: {
        error: { code: "INTERNAL_ERROR", message: GENERIC_ERROR_MESSAGE, requestId: "req-3" },
      },
    });
    expect(JSON.stringify(response)).not.toContain("hunter2");
    expect(JSON.stringify(response)).not.toContain("10.0.0.5");
  });

  it.each([["a string"], [null], [undefined], [{ some: "object" }]])(
    "handles non-Error thrown values (%s)",
    (thrown) => {
      expect(toErrorResponse(thrown, "req-4").body.error.code).toBe("INTERNAL_ERROR");
    },
  );
});

describe("normalizeError", () => {
  it("produces a JSON-serializable object with code and status for AppError", () => {
    const normalized = normalizeError(
      new AppError("BAD_REQUEST", "Requête invalide.", { status: 400 }),
    );
    expect(normalized).toMatchObject({
      name: "AppError",
      message: "Requête invalide.",
      code: "BAD_REQUEST",
      status: 400,
    });
    expect(JSON.parse(JSON.stringify(normalized))).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("includes the cause chain, with a depth limit", () => {
    const root = new Error("root cause");
    const wrapped = new AppError("SERVICE_UNAVAILABLE", "Indisponible.", {
      status: 503,
      cause: root,
    });
    expect(normalizeError(wrapped).cause).toMatchObject({ name: "Error", message: "root cause" });

    let deep: Error = new Error("level 0");
    for (let level = 1; level <= 10; level += 1) {
      deep = new Error(`level ${level}`, { cause: deep });
    }
    let depth = 0;
    for (let current = normalizeError(deep).cause; current; current = current.cause) {
      depth += 1;
    }
    expect(depth).toBe(3);
  });

  it("describes non-Error values without crashing", () => {
    expect(normalizeError("boom")).toEqual({ name: "NonErrorThrown", message: "boom" });
    expect(normalizeError(42)).toEqual({
      name: "NonErrorThrown",
      message: "Thrown value of type number",
    });
  });
});
