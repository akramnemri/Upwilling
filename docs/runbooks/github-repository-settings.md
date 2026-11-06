# Runbook — GitHub repository settings

- Who: the supervisor (repository admin). The agent never changes these settings.
- When: once, after the first CI run on a PR (Task 0.6). Re-check when a workflow job is renamed.
- Repository: `https://github.com/akramnemri/Upwilling` (public).
- Source of the rules: `docs/ai/03_GIT_TESTING_PIPELINE.md` §1 and §12, ADR-016.

GitHub moves its settings pages from time to time; if a label below differs, look for the closest equivalent.

## 1. Default branch

Settings → General → Default branch: **`develop`** (already done in session 1, check only).

## 2. Pull request merge methods

Settings → General → Pull Requests:

- [x] Allow merge commits — used only for `develop → main` promotions.
- [x] Allow squash merging — feature PRs. Default commit message: "Pull request title".
- [ ] Allow rebase merging — off.
- [x] Automatically delete head branches.

## 3. Rulesets

Settings → Rules → Rulesets → New ruleset → New branch ruleset. Create two rulesets with the same rules.

| Field | `protect-develop` | `protect-main` |
|---|---|---|
| Enforcement status | Active | Active |
| Bypass list | empty | empty |
| Target branches | Include by pattern: `develop` | Include by pattern: `main` |

Rules to tick in both:

- [x] Restrict deletions
- [x] Block force pushes
- [x] Require a pull request before merging
  - Required approvals: **0** while there is one human reviewer (set to 1 when a second developer joins).
  - Allowed merge methods: `develop` → Squash only; `main` → Merge only.
- [x] Require status checks to pass
  - Add the checks **`checks`**, **`secret-scan`**, **`docker`** and **`shellcheck`** (source: GitHub Actions).
    They can only be picked once the CI workflow has run at least once (the Task 0.6 PR does that;
    `docker` exists from the Task 1.1b PR on, `shellcheck` from the Task 1.3 PR on: add them to both rulesets then).
  - "Require branches to be up to date before merging": off for now (one developer; avoids extra CI runs).

Leave "Require linear history" **off**: `develop → main` uses merge commits.

## 4. GitHub Actions

Settings → Actions → General:

- Actions permissions: allow all actions (the workflow pins every action to a commit SHA, ADR-018).
- Fork pull request workflows from outside collaborators: **Require approval for all external contributors**
  (public repository: a stranger's PR must not run workflows without your review).
- Workflow permissions: **Read repository contents and packages permissions**.
- [ ] Allow GitHub Actions to create and approve pull requests — off.

## 5. Security features (free on public repositories)

Settings → Advanced Security (or "Code security"):

- Secret scanning: **enable**, and enable **Push protection** (blocks a push containing a known secret format,
  before it becomes public; complements the gitleaks job in CI).
- Dependabot alerts: **enable**. (Dependabot version-update PRs are not configured yet.)

## 6. Check that it works

1. Open a PR to `develop` with a deliberate lint error (e.g. an unused variable). CI `checks` fails and the
   merge button is blocked.
2. Push the fix. `checks` and `secret-scan` turn green and the PR can be squash-merged.
3. `git push origin develop` from a local commit is refused.

If something blocks unexpectedly, send a screenshot of the ruleset page and the PR's checks list.
