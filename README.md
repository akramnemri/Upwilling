# UpWilling web platform

One monorepo, one Next.js application (Payload CMS from Milestone 3) serving two sites:

- `upwilling.fr` — the academy (training center)
- `careerboost.upwilling.fr` — the association UpWilling Career Boost

Architecture and rules: [`docs/ai/01_ARCHITECTURE.md`](docs/ai/01_ARCHITECTURE.md).
Decisions: [`docs/decisions/`](docs/decisions/README.md). Current progress: [`docs/progress/STATUS.md`](docs/progress/STATUS.md).

## Prerequisites

| Tool    | Version               | Notes                                                                                                                          |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Node.js | 24 LTS (see `.nvmrc`) | `pnpm install` refuses other majors.                                                                                           |
| pnpm    | 11.28.6               | Provided by Corepack from the `packageManager` field: run `corepack enable` once (needs an administrator terminal on Windows). |
| Git     | any recent            | The repository uses LF line endings (`.gitattributes`).                                                                        |

Docker (for the local mail catcher and, later, the database) is introduced in Task 0.3.

## Setup

```bash
git clone https://github.com/akramnemri/Upwilling.git
cd Upwilling
git switch develop
corepack enable
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The temporary page says "UpWilling — en construction".

## Commands (run from the repository root)

| Command                             | What it does                                             |
| ----------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                          | Starts the Next.js dev server for `apps/web`.            |
| `pnpm build`                        | Production build of every package.                       |
| `pnpm typecheck`                    | TypeScript checks (generates Next.js route types first). |
| `pnpm lint`                         | ESLint with type-aware rules.                            |
| `pnpm test`                         | Unit and integration tests (none yet; Task 0.5).         |
| `pnpm e2e`                          | End-to-end tests (none yet; Task 0.5).                   |
| `pnpm format` / `pnpm format:check` | Prettier write / check. `docs/` is never reformatted.    |

## Layout

```text
apps/web/                 Next.js application (both sites, later the admin and the worker)
packages/config/          Shared tsconfig, ESLint and Prettier presets
packages/design-system/   Tokens, brand themes and components (Milestone 2)
docs/                     Architecture, decisions, progress, runbooks
```

## Rules that matter

- The repository is **public**: never commit secrets, `.env` files or real personal data. Copy `.env.example` instead.
- Never push to `main` or `develop` directly: one branch and one pull request per task (ADR-016).
