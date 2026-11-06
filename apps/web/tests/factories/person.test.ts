import { beforeEach, describe, expect, it } from "vitest";

import { assertSyntheticEmail, buildPerson, resetPersonSequence } from "./person";

describe("buildPerson", () => {
  beforeEach(() => {
    resetPersonSequence();
  });

  it("generates deterministic, obviously fake people", () => {
    expect(buildPerson()).toEqual({
      firstName: "Prénom1",
      lastName: "Exemple1",
      email: "personne-1@example.test",
    });
    expect(buildPerson().email).toBe("personne-2@example.test");
  });

  it("only ever generates @example.test emails", () => {
    const people = Array.from({ length: 50 }, () => buildPerson());
    for (const person of people) {
      expect(person.email).toMatch(/^[^@\s]+@example\.test$/);
    }
    expect(new Set(people.map((person) => person.email)).size).toBe(people.length);
  });

  it("applies overrides", () => {
    expect(buildPerson({ firstName: "Testeur", email: "autre@example.com" })).toMatchObject({
      firstName: "Testeur",
      email: "autre@example.com",
    });
  });

  it("refuses an override with a non-reserved email domain", () => {
    expect(() => buildPerson({ email: "someone@gmail.com" })).toThrow(/reserved email domain/);
  });
});

describe("assertSyntheticEmail", () => {
  it.each(["a@example.test", "b@EXAMPLE.TEST", "c@example.com"])("accepts %s", (email) => {
    expect(() => assertSyntheticEmail(email)).not.toThrow();
  });

  it.each([
    "no-at-sign",
    "a@example.test.fr",
    "a@notexample.com",
    "a@sub.example.org",
    "a@upwilling.fr",
  ])("refuses %s", (email) => {
    expect(() => assertSyntheticEmail(email)).toThrow(/reserved email domain/);
  });
});
