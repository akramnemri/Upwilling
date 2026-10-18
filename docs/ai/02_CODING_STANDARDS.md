# 02 — Coding Standards: Maintainability, Security, Debuggability

Act as a senior TypeScript / Next.js / Payload engineer and reviewer.

These rules apply to every line you write in this repository.

## Core principle

Write code for another competent developer who will debug it six months from now,
probably a half-time student developer with little context.

Prefer understandable code over compact code.
Prefer explicit logic over magic.
Prefer a small robust solution over a clever general framework.

---

## 1. TypeScript

- `strict: true`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` if they do not fight Payload's generated types (decide in M0, record in an ADR).
- No `any` without a comment explaining the boundary. Prefer `unknown` + validation.
- Explicit domain types. Payload generates collection types (`payload-types.ts`): use them for persistence,
  but keep domain types separate where the domain meaning differs.
- Keep provider types (Stripe, Brevo, Umami) inside the integration layer. They never leak into UI or other modules.
- Validate every external input at runtime with a schema library (Zod or the one chosen in M0):
  environment variables, route handler input, server action input, webhook payloads, query parameters, file metadata.
- Discriminated unions for states with different shapes (`order.status`, `membership.state`, `job.result`).
- No type assertions (`as X`) to silence uncertainty. Validate first.

## 2. React / Next.js

- Server Components by default. Client Components only for interactivity (forms with live validation, menus, accordions, tabs).
- Never put in client code: secrets, provider credentials, Payload Local API calls, server-only business logic.
  Mark server-only modules with `import "server-only"`.
- Mutations go through server actions or route handlers that validate input, check authorization, call a module service.
- Data fetching for pages happens on the server, through module services, with explicit caching and tags.
- Every route segment that fetches data has `loading.tsx` or a Suspense boundary, and `error.tsx`.
- Components stay focused. A component does not fetch, validate, transform, mutate and render all at once.
- Use the design system components and tokens. No ad-hoc colors, font sizes or spacing values (see `04_DESIGN_SYSTEM.md`).
- Verify Next.js APIs against the installed version (caching APIs, proxy/middleware naming, params as promises, etc.).

## 3. Payload CMS rules

- Each collection belongs to exactly one module (`modules/<name>/collections/`).
- **Access control is mandatory** on every collection, global and sensitive field. Deny by default.
  Write access helpers once in `core` (`isSuperAdmin`, `isStaffOfTenant`, `isOwner`, `isTrainerOfCourse`…) and reuse them.
- **Local API bypasses access control by default.** When acting for a request: `overrideAccess: false` and `user: req.user`.
  System operations (jobs, webhooks, seeds) may override access, with a comment explaining why.
- Hooks stay small. A hook that does more than a few lines calls a module service.
  Hooks that trigger slow work enqueue a job instead of doing it inline.
- Always pass `depth` explicitly in queries. Select only needed fields when the API allows it.
- Use Payload transactions (pass `req` through nested operations) for multi-document business operations.
- Enable `versions.drafts` on editorial collections. Admin labels and descriptions in French.
- Every schema change produces a migration (see `03_GIT_TESTING_PIPELINE.md` §10).
- Do not edit generated files by hand (`payload-types.ts`, generated admin import map). Regenerate them.

## 4. Business logic and module boundaries

Direction:

```text
UI (page / component)
 -> server action or route handler (validate, authenticate, authorize)
 -> module service (business rules)
 -> Payload Local API / database / provider adapter
```

- Keep layers proportional to the complexity. A read-only page may call a service directly.
- Do not add repository/factory/manager abstractions "because it is professional".
- Other modules are reached only through `modules/<name>/index.ts`.
- Cross-module side effects use domain events and jobs (see `01_ARCHITECTURE.md` §7).

## 5. External providers (Stripe, Brevo, R2, Umami, Cloudflare, Sentry)

Treat every provider as an unreliable, untrusted boundary. For every call, decide and implement:

- input/output validation;
- authentication and credential source (environment only);
- timeout (default 5 s for user-facing calls, longer only with a reason);
- typed error mapping to `AppError` codes;
- retry policy — **never** blindly retry a non-idempotent operation; use provider idempotency keys (Stripe) when available;
- idempotency on our side (unique constraint on provider event IDs);
- partial failure: what if the provider succeeded but our write failed, or the reverse;
- rate limits;
- observability (log the operation and provider IDs, never payloads with personal data);
- kill switch behavior.

Before integrating a provider, verify its current official documentation and record the verified requirements
in `docs/integrations/<provider>.md` (API version, webhook signature method, test mode, limits).

## 6. Database

- Use PostgreSQL features intentionally: foreign keys, unique constraints, check constraints, indexes for real queries,
  transactions, pagination, selective columns.
- Model core business concepts as real fields and relations. JSON columns only for opaque provider payloads
  or genuinely evolving data.
- Money: integer minor units (cents) + currency code. Never floats.
- Dates: store UTC timestamps; display in `Europe/Paris`. Session dates are business dates: be explicit about time zones.
- Concurrency-sensitive operations (seats, invoice numbers, promo code usage limits) are tested with concurrent calls.
- Invoice numbers come from a dedicated sequence per legal entity, allocated inside the transaction that issues the invoice.

## 7. Multi-tenancy and security

Treat every request as untrusted. Always consider:

- authentication and tenant authorization;
- tenant derived from host only (never from client input);
- input validation and output encoding (XSS); never render unsanitized HTML;
- IDOR: every ID from a client is re-checked against the current user and tenant;
- CSRF for cookie-authenticated mutations (server actions' origin checks + Payload CSRF allowlist);
- SSRF: never fetch a URL provided by a user; allowlist video embed providers;
- rate limiting on login, sign-up, password reset, forms, checkout creation;
- anti-bot on public forms (Cloudflare Turnstile, server-side verification);
- duplicate and replayed webhooks;
- file uploads: type and size allowlist, private bucket for sensitive files, no execution, randomized keys;
- secret exposure: secrets only in environment variables, validated at startup, never logged, never sent to the client;
- security headers via Caddy and Next (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors).

## 8. Personal data (RGPD)

This system processes personal data of learners, members, donors, volunteers, applicants and trainers
(identity, contact details, CVs, qualification documents, payment-related data, learning progress).

- Development and automated tests use **synthetic data only**. Use clearly fake domains (`example.test`, `example.com`).
- Never put real names, emails, phone numbers, CVs, invoices or screenshots with real data into fixtures, seeds,
  committed screenshots, logs, error messages or test snapshots.
- Collect only what the requirement needs. Every new personal-data field needs a stated purpose and a retention rule
  (added to `docs/analytics/retention.md` or the module's docs).
- Each tenant is a separate data controller: never expose one tenant's personal data to the other tenant's staff.
- Every module that stores personal data provides export and anonymisation functions (data subject requests).
- Do not claim GDPR compliance in code, docs or UI. Compliance is a legal assessment, not a library feature.

## 9. Error handling

- No empty `catch` blocks. No silent conversion of unexpected errors to `null` or empty arrays.
- One `AppError` class with a stable `code` (e.g. `CHECKOUT_PROVIDER_UNAVAILABLE`), a safe French user message,
  an HTTP status, and optional internal context.
- Expected business outcomes (seat full, membership already active) are typed results or `AppError`s with specific codes,
  not generic 500s.

```ts
try {
  await createCheckoutSession(input);
} catch (error) {
  logger.error("checkout session creation failed", {
    requestId,
    operation: "commerce.createCheckoutSession",
    tenant,
    error: normalizeError(error),
  });
  throw new AppError(
    "CHECKOUT_PROVIDER_UNAVAILABLE",
    "Le paiement est momentanément indisponible. Merci de réessayer dans quelques minutes.",
    { status: 503 },
  );
}
```

## 10. Logging

- Structured JSON logs (one logger module, e.g. pino), with a request ID on every line of a request and job.
- Include: `requestId`, `operation`, `tenant`, `jobId`, provider event IDs, error category, duration.
- Redact by default: passwords, tokens, cookies, authorization headers, Stripe secrets, signed URLs, email addresses,
  phone numbers, message bodies, file contents.
- Never log a whole request, response, Payload document or webhook payload.
- Log levels mean something: `error` = needs attention, `warn` = degraded but handled, `info` = business milestones, `debug` = local only.

## 11. Comments

Comments explain **why** a non-obvious decision exists. They do not narrate the code.

Good:

```ts
// Stripe retries webhooks for days; the unique index on stripe_event_id makes reprocessing a no-op.
```

Bad:

```ts
// Loop through the orders.
```

## 12. Naming and language

- Code, identifiers, comments, commits, docs: English. UI copy, admin labels, emails: French.
- Domain names, not technical filler:
  good — `reserveSessionSeat`, `issueInvoice`, `resolveTenantFromHost`, `activateMembership`;
  bad — `processData`, `handleStuff`, `helper2`, `manager`, `utils.ts` as a dumping ground.
- French domain terms keep one English name, defined once in a glossary (`docs/glossary.md`):
  formation → `training`, session inter → `publicSession`, intra → `inCompanyRequest`, adhésion → `membership`,
  don → `donation`, formateur → `trainer`, apprenant → `learner`, recette → `staging`/`recette`, devis → `quote`.

## 13. File responsibility

Split files by responsibility. Do not keep a 1000-line file because it works.
Do not create 50 tiny files because abstraction feels professional.
Split when it makes a boundary clearer, testable, reusable, or substantially easier to debug.

## 14. State handling

Represent important states explicitly with enums/unions and allowed transitions, tested:

```text
order:        draft -> pending_payment -> paid -> refunded | cancelled | payment_failed
seat:         held -> confirmed | released ; waitlisted -> offered -> confirmed | expired
membership:   pending_payment -> active -> expired | cancelled
course:       draft -> submitted -> changes_requested -> submitted -> approved -> published -> archived
```

Exact names may change per module design, but never "a nullable date means it's active".

## 15. Performance

Avoid known anti-patterns: whole-table fetches, N+1 queries, unbounded lists, client-side polling, repeated provider
calls for identical data, heavy client bundles on marketing pages, uncached public pages.
Measure before optimizing. Respect the budgets in `01_ARCHITECTURE.md` §11.

## 16. Accessibility (TR-07)

- Semantic HTML first. Correct heading order. Landmarks (`header`, `nav`, `main`, `footer`).
- Every interactive element is keyboard-reachable with a visible focus ring.
- Text contrast ≥ WCAG AA (4.5:1 normal text, 3:1 large text and UI components). Tokens are tested for this.
- Images have meaningful `alt` (required field in the CMS) or empty `alt` when decorative.
- Forms: labels, error messages linked with `aria-describedby`, no placeholder-only labels.
- Respect `prefers-reduced-motion`.
- Automated axe checks in e2e tests on key pages.

## 17. Infrastructure code (Docker, Compose, Caddy, CI)

- Pin image versions (major.minor at least). No `latest`.
- Containers run as non-root, with read-only file systems where practical, memory limits, healthchecks and log rotation.
- No secrets in Dockerfiles, compose files or workflow files; use environment files on the server (created by the human)
  and GitHub encrypted secrets.
- Scripts are idempotent, `set -euo pipefail`, print what they do, and have a dry-run mode when destructive.
- Every infra change comes with a runbook update in `docs/runbooks/`.

## 18. Dependency discipline

Before installing a dependency:

1. check whether Next.js, Payload, the platform or an existing dependency already provides it;
2. verify it solves a real problem, is maintained, and has a compatible license;
3. prefer mature focused libraries; avoid packages for trivial helpers;
4. state the reason in your plan and in the PR description.

## 19. Tests

Tests protect behavior, not implementation details. Priorities:

- access control and tenant isolation (every tenant-scoped collection);
- validation of external input;
- money, seats, invoice numbering, state transitions;
- webhook signature verification and idempotency;
- provider error handling and kill switches;
- pagination and ordering;
- critical UI states (loading, empty, error, success);
- accessibility on key pages.

For every meaningful feature, ask:

```text
What can a wrong implementation accidentally expose, duplicate, lose, overcharge or corrupt?
```

Cover those failure modes first.

## 20. Simplicity review (before every task report)

- Can another developer understand it quickly? Is the control flow obvious?
- Is every abstraction necessary?
- Are authentication, tenant and ownership checks present? Can another tenant reach this row?
- Can the provider send this event twice? What if it never arrives?
- What happens if the external API is down or slow?
- What happens if the database write succeeds but the response fails?
- Are secrets and personal data protected in code, logs and errors?
- Will it behave sensibly with 10 users and with 10,000?
- Is there an easy way to reproduce a failure?

If two approaches are equally robust, use the simpler one.
