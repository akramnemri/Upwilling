# UpWilling web platform

One monorepo, one Next.js application (Payload CMS from Milestone 3) serving two sites:

- `upwilling.fr` — the academy (training center)
- `careerboost.upwilling.fr` — the association UpWilling Career Boost

Architecture and rules: [`docs/ai/01_ARCHITECTURE.md`](docs/ai/01_ARCHITECTURE.md).
Decisions: [`docs/decisions/`](docs/decisions/README.md). Current progress: [`docs/progress/STATUS.md`](docs/progress/STATUS.md).

## Prerequisites

| Tool    | Version                                  | Notes                                                                                                                          |
| ------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Node.js | 24 LTS (see `.nvmrc`)                    | `pnpm install` refuses other majors.                                                                                           |
| pnpm    | 11.28.6                                  | Provided by Corepack from the `packageManager` field: run `corepack enable` once (needs an administrator terminal on Windows). |
| Git     | any recent                               | The repository uses LF line endings (`.gitattributes`).                                                                        |
| Docker  | Docker Desktop / Engine with Compose v2+ | Runs the local services in `infra/local/compose.yaml` (Mailpit; the database later, ADR-005).                                  |

## Setup

```bash
git clone https://github.com/akramnemri/Upwilling.git
cd Upwilling
corepack enable
pnpm install
cp .env.example apps/web/.env.local
docker compose -f infra/local/compose.yaml up -d
pnpm dev
```

## Local hosts

The app serves one site per host name. `localhost` itself is **not** a known host and answers 404.

| URL                                 | Serves                                  |
| ----------------------------------- | --------------------------------------- |
| <http://upwilling.localhost:3000>   | Academy site (tenant `upwilling`)       |
| <http://careerboost.localhost:3000> | Association site (tenant `careerboost`) |
| <http://admin.localhost:3000>       | Admin host (Payload from Milestone 3)   |
| <http://localhost:8025>             | Mailpit: emails captured locally        |

Modern browsers resolve `*.localhost` to `127.0.0.1` by themselves. If yours does not, add to your hosts file
(`C:\Windows\System32\drivers\etc\hosts` on Windows, `/etc/hosts` elsewhere):

```text
127.0.0.1 upwilling.localhost careerboost.localhost admin.localhost
```

If a required environment variable is missing or invalid, the server prints the list and exits.

## Commands (run from the repository root)

| Command                             | What it does                                             |
| ----------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                          | Starts the Next.js dev server for `apps/web`.            |
| `pnpm build`                        | Production build of every package.                       |
| `pnpm typecheck`                    | TypeScript checks (generates Next.js route types first). |
| `pnpm lint`                         | ESLint with type-aware rules.                            |
| `pnpm test`                         | Unit tests (Vitest); integration tests come in Task 0.5. |
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
