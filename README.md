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

## Operations endpoints and logs

| Endpoint                  | Purpose                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /api/health`         | Liveness: always `{"status":"ok"}`, on any host (Docker healthcheck). Checks nothing else.        |
| `GET /api/ready`          | Readiness: configuration (and the database once it exists). `503` when not ready.                 |
| `GET /api/dev/test-error` | Local only (`DEPLOY_ENV=local`): returns an error on purpose. `?kind=expected` for a handled one. |
| `/dev/test-error`         | Local only: a page that fails while rendering, to see the error page.                             |

Server logs are JSON lines on stdout. Every line of a request carries the same `requestId`, also returned to the
client in the `x-request-id` response header and shown on error responses. Passwords, tokens, cookies, emails and
similar values are replaced with `[REDACTED]`. Log through `getLogger()` / `getRequestLogger()`, never `console`.

## Commands (run from the repository root)

| Command                             | What it does                                             |
| ----------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                          | Starts the Next.js dev server for `apps/web`.            |
| `pnpm build`                        | Production build of every package.                       |
| `pnpm typecheck`                    | TypeScript checks (generates Next.js route types first). |
| `pnpm lint`                         | ESLint with type-aware rules.                            |
| `pnpm test`                         | Unit and integration tests (Vitest).                     |
| `pnpm e2e`                          | Builds, then runs the end-to-end tests (Playwright).     |
| `pnpm format` / `pnpm format:check` | Prettier write / check. `docs/` is never reformatted.    |

## Tests

| Kind        | Where                                                    | Run                                                   |
| ----------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Unit        | `apps/web/src/**/*.test.ts`, `apps/web/tests/factories/` | `pnpm test`, or `pnpm test:unit` in `apps/web`        |
| Integration | `apps/web/tests/integration/`                            | `pnpm test`, or `pnpm test:integration` in `apps/web` |
| End-to-end  | `apps/web/tests/e2e/*.spec.ts`                           | `pnpm e2e` (builds first)                             |

Integration tests will use the local database once it exists (ADR-005); until then the project holds a placeholder.

End-to-end tests run the **production build** with `next start` on port 3100 (`DEPLOY_ENV=local`), so they do not
clash with `pnpm dev` on 3000. They open the local hosts (`upwilling.localhost:3100`, …) in Chromium. Install the
browser once per machine (about 100 MB, stored outside the repository):

```bash
pnpm --filter @upwilling/web exec playwright install chromium --only-shell
```

Reading a failure:

- **Vitest** prints the failing test name, an expected/received diff and the source line.
- **Playwright** prints the failing step, the locator, expected/received and the source line. A screenshot and a
  trace of each failed test are kept: open the report with `pnpm --filter @upwilling/web exec playwright show-report`
  (the Trace tab replays every step with the page, network and console).
- Lines prefixed `[WebServer]` are the app's own error output. The `/dev/test-error` test prints one on purpose.

Test data is synthetic only: build people with `apps/web/tests/factories/` (emails on `example.test`). Never put
real names, emails or phone numbers in tests.

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
