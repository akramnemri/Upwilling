# 00 — How to Use This Prompt Pack (for the supervisor)

This file is for you, the human supervisor. It explains how to run the AI coding sessions,
what to paste, what to check, and what only you can do.

---

## 1. What is in the pack

| File | Purpose | Who reads it |
|---|---|---|
| `CLAUDE.md` (repo root) | Short always-loaded rules and work loop | The agent, every session |
| `docs/ai/00_HOW_TO_USE.md` | This guide | You |
| `docs/ai/01_ARCHITECTURE.md` | What we build and how it is structured | The agent, on demand |
| `docs/ai/02_CODING_STANDARDS.md` | How code must be written | The agent, on demand |
| `docs/ai/03_GIT_TESTING_PIPELINE.md` | Branches, gates, CI/CD, task report format | The agent, on demand |
| `docs/ai/04_DESIGN_SYSTEM.md` | Brands, tokens, components, Masar-inspired patterns | The agent, for UI work |
| `docs/ai/05_ROADMAP.md` | Milestones M0–M10 and bounded tasks | The agent, current milestone only |
| `docs/progress/STATUS.md` | Live memory between sessions | Both |

## 2. One-time setup (you)

```bash
git clone https://github.com/akramnemri/Upwilling.git
cd Upwilling
# copy the pack: CLAUDE.md at the root, the rest under docs/
mkdir -p docs/ai docs/progress docs/decisions docs/sources docs/phase0 docs/runbooks
# put the two PDFs (Stratégie v2.1, Phase 0) in docs/sources/
git add .
git commit -m "docs: add AI prompt pack, roadmap and source documents"
git push origin main
git switch -c develop
git push -u origin develop
```

Then in GitHub (Settings):

- Default branch → `develop`.
- General → Pull Requests: allow squash merging and merge commits, disable rebase merging; enable "Automatically delete head branches".
- Rules → Rulesets: one for `main` and one for `develop` — require a pull request, block force pushes, block deletions.
  Add "require status checks" once CI exists (Task 0.6). Required approvals: 0 if you are the only reviewer, 1 if the second developer reviews.
- Environments (Task 1.5): `recette`, `production` (add yourself as required reviewer on `production`).

**Public repository warning:** never paste secrets into issues, PRs, commits or prompts that end up in files.

## 3. The session loop

```text
You: start-of-session prompt (A)
Agent: reads STATUS.md + current milestone, posts a plan, waits
You: "go" (B) or corrections
Agent: implements one task, runs checks, opens a PR, posts the TASK REPORT, stops
You: run the manual test steps
You: report the result (C or D)
Agent: fixes, or (after your merge) cleans up and proposes the next task
```

Rules of thumb:

- One task per round. If the agent starts a second task, stop it.
- Read the plan before saying "go": it is the cheapest moment to correct direction.
- You merge the PRs (squash). The agent never merges into `develop` or `main`.
- Start a **new session** at each milestone boundary, or when answers get slower, vaguer or start forgetting rules.

## 4. Prompts to copy and paste

### A — Start of session

```text
New session. Read CLAUDE.md, then docs/progress/STATUS.md, then only the section of
docs/ai/05_ROADMAP.md for the current milestone. Read other docs/ai files only if the
current task needs them.

Then:
1. Summarize in 5 lines where we are (milestone, last completed task, open issues).
2. Restate the next task, its acceptance criteria and its requirement IDs.
3. Post your plan (max ~15 lines): files you will touch, dependencies you want to add (with reasons),
   migrations, tests, risks, anything you need from me.
Do not write code yet. Wait for my "go".
```

### B — Approve the plan

```text
go
```

or, to let the agent continue without waiting for plan approval on small tasks:

```text
go — autopilot for this task only. Still stop after the task report.
```

### C — Manual test passed

```text
Manual test PASSED for Task <X.Y>.
I merged PR #<n> into develop (squash).
Verify the merge, sync develop, delete the feature branch per 03 §4b, confirm recette deployed
(if the deploy pipeline exists), update STATUS.md, then post the plan for the next task and wait.
```

### D — Manual test failed

```text
Manual test FAILED for Task <X.Y>.
Step <n>: <what I did>
Expected: <...>
Got: <...>
Evidence: <error message / console output / log lines / screenshot description>
Environment: local | recette, browser <...>

Diagnose before changing code: explain the probable cause and your fix plan, then wait for my "go".
Stay on the same branch.
```

### E — End of session / handoff

```text
We stop here for this session. Update docs/progress/STATUS.md so that a brand-new session can
continue without this conversation: current milestone and task, state of the branch/PR,
decisions taken today, open issues, exact next step. Commit it on the current branch
(or on a chore/status branch if no task branch is open). Then give me a 5-line summary.
```

### F — Start of a milestone

```text
We are starting Milestone <M>. Read its section in docs/ai/05_ROADMAP.md.
Before the first task: list the milestone's tasks, the [HUMAN] and [PO] items I must prepare,
risks you see, and any task you think should be split or reordered. Do not start Task <M.1> yet.
```

### G — Milestone promotion to production

```text
Milestone <M> is accepted on recette. Prepare the promotion:
1. Run the develop regression checklist (03 §9) and report results.
2. List migrations and env changes since the last production release.
3. Open the PR develop -> main (merge commit) with a release summary.
4. Write the production smoke test steps (03 §13) for me.
Stop after that. I will merge, approve the deployment and run the smoke test.
```

### H — Change of scope or new decision

```text
Decision: <what was decided, by whom, date>.
Record it as a new ADR in docs/decisions/, update the affected sections of docs/ai/*.md and
docs/ai/05_ROADMAP.md, and show me the diff before committing (chore/ branch + PR).
```

### I — Self-review before I test

```text
Before I test, review your own diff against 02_CODING_STANDARDS.md §20 (simplicity review) and
§7 (security). List any problem you find and fix it, or explain why it is acceptable.
```

### J — The agent is drifting

```text
Stop. You are outside the current task (<what it is doing>). Revert anything unrelated to Task <X.Y>,
re-read CLAUDE.md and the task definition, and restate the scope in 3 lines before continuing.
```

## 5. Your review checklist for each PR (5–10 minutes)

- Does the PR do only the current task? Any surprise files in `git diff --stat`?
- Any secret, real email, real name, `.env` file, large binary or generated junk?
- New dependencies: justified? maintained? license OK?
- Migrations: present when the schema changed? Readable?
- Access control: is there an isolation/permission test for what changed?
- UI: French copy, brand tokens only (no raw colors), works on mobile, keyboard focus visible.
- Errors: user sees a safe French message; logs don't contain personal data.
- The task report lists skipped checks honestly.

## 6. Only you can do these

- Buy the VPS (8 GB RAM), the recette domain; configure Cloudflare DNS, Access, R2.
- Create accounts and keys: Stripe (two accounts: academy and association), Brevo, Sentry, uptime monitor.
- Put secrets into GitHub environments and the server `.env` files.
- Run the server provisioning scripts and the first manual start.
- Approve production deployments and run smoke tests.
- Obtain PO decisions, logos/colors/fonts, legal texts, membership amounts, VAT/invoicing guidance.
- Perform the real backup restore drill.

## 7. Keeping token usage under control

- The agent reads `STATUS.md` + one roadmap section, not everything. Remind it if it starts reading every file.
- Keep tasks small. A task that needs more than ~10 changed files or more than one new collection is probably two tasks.
- New session per milestone; new session when a debugging thread gets long — after a handoff (prompt E).
- Ask for diffs of specific files rather than whole-file dumps.
- Do not paste long logs: paste the first error and 20 lines around it.

## 8. STATUS.md structure (the agent creates it in Task 0.1)

```markdown
# STATUS

Updated: <date> by <agent/session>

## Current position
- Milestone: M<x> — <name>
- Task: <x.y> — <title> — state: planned | in progress | awaiting manual test | done
- Branch / PR: <branch> — <PR link>

## Last completed tasks
- <x.y> — <title> — merged <date>

## Decisions since last milestone
- ADR-<n> — <one line>

## Open issues / risks
- ...

## Waiting on human / PO
- ...

## Next step (exact)
- ...
```
