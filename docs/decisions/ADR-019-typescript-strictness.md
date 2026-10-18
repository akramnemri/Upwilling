# ADR-019 — TypeScript strictness options

- Status: Proposed (supervisor to confirm in the Task 0.2 review; re-checked in Task 3.1)
- Date: 2026-10-18
- Source: `docs/ai/02_CODING_STANDARDS.md` §1

## Context

02 §1 asks for `strict: true`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` "if they do not
fight Payload's generated types", with the decision taken in M0. Payload is only installed in Task 3.1, so its
generated types (`payload-types.ts`) cannot be tested yet.

## Decision

`packages/config/tsconfig/base.json`, extended by every package, enables:

| Option | Why |
|---|---|
| `strict` | Baseline type safety. |
| `noUncheckedIndexedAccess` | `array[i]` and `record[key]` may be `undefined`; forces handling the missing case (host map lookups, query results). |
| `exactOptionalPropertyTypes` | Distinguishes "absent" from "explicitly `undefined`", which matters for partial updates sent to Payload. |
| `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` | Cheap protections for state machines (02 §14). |

ESLint uses typescript-eslint's `recommendedTypeChecked` preset plus `no-explicit-any`, `consistent-type-imports`,
`eqeqeq` and `no-console` (the structured logger replaces `console` in Task 0.4).

## Consequences

- Slightly more verbose code around indexing and optional properties.
- In Task 3.1, if Payload's generated types or Payload config typings produce errors under
  `exactOptionalPropertyTypes` that cannot be fixed without type assertions, we disable that one option
  in a new ADR rather than spreading `as` casts.

## Revisit when

Task 3.1 (Payload installation).
