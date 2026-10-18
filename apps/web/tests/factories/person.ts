/**
 * Synthetic people for tests and, later, local seeds. Values are deterministic (a per-file sequence,
 * since Vitest isolates modules per test file) and obviously fake, so a failure output or a log line
 * can never be mistaken for real personal data (02_CODING_STANDARDS.md §8).
 */
export type SyntheticPerson = {
  firstName: string;
  lastName: string;
  email: string;
};

// Reserved by RFC 2606 / RFC 6761: never routable, never someone's real mailbox.
const ALLOWED_EMAIL_DOMAINS = ["example.test", "example.com"] as const;

let sequence = 0;

export function buildPerson(overrides: Partial<SyntheticPerson> = {}): SyntheticPerson {
  sequence += 1;
  const person: SyntheticPerson = {
    firstName: `Prénom${sequence}`,
    lastName: `Exemple${sequence}`,
    email: `personne-${sequence}@example.test`,
    ...overrides,
  };
  assertSyntheticEmail(person.email);
  return person;
}

/** Throws when an email (typically an override) is not on a reserved test domain. */
export function assertSyntheticEmail(email: string): void {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  const isAllowed = ALLOWED_EMAIL_DOMAINS.some((allowed) => domain === allowed);
  if (!email.includes("@") || !isAllowed) {
    throw new Error(
      `Test data must use a reserved email domain (${ALLOWED_EMAIL_DOMAINS.join(", ")}), got "${domain}".`,
    );
  }
}

/** Restarts the sequence, for tests that compare exact generated values. */
export function resetPersonSequence(): void {
  sequence = 0;
}
