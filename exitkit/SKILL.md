---
name: exitkit
description: Audits one risky or outdated dependency in a repository, maps every usage, gets an exit plan from an open-weight model as checkable claims, verifies those claims with code, applies the change in a git worktree, re-runs checks, and writes a Dependency Exit Capsule that separates observed, executed and AI-generated information. Use when asked to assess, replace or remove a dependency.
license: MIT
compatibility: Needs Node.js 18+, git, and for the AI step an OpenAI-compatible endpoint serving an open-weight model (EXITKIT_BASE_URL, EXITKIT_MODEL). Python or Node projects.
---
# ExitKit

## Steps
1. `npx exitkit scan <repo>`: list dependencies with file and line.
2. `npx exitkit risk <repo>`: maintenance signals only (no CVEs). Add `--online` for stale-package checks.
3. `npx exitkit usages <repo> <package>`: every usage plus the exit footprint.
4. `npx exitkit checks <repo>`: baseline checks. Missing tests are recorded as `not_run`, never hidden.
5. `npx exitkit analyze <repo> <package>`: open-weight model returns plan, diff and typed claims (AI-GENERATED).
6. `npx exitkit ledger <repo>`: code marks each claim CONFIRMED, REFUTED or UNVERIFIABLE.
7. `npx exitkit patch <repo>`: apply the diff in a git worktree and run the after-checks. The original checkout is never edited.
8. `npx exitkit capsule <repo>`: build and schema-validate `capsule.json` and `capsule.md`.
9. `npx exitkit verify .exitkit/capsule.json`: re-run the recorded commands and compare.

`npx exitkit run <repo> --package <name>` performs steps 1 to 8 in one go.

Read `references/provenance-rules.md` before changing how entries are tagged.

## Rules
- Never present AI output as observed or executed. The builder rejects it.
- Report refuted claims, failed checks and `not_run` checks prominently.
- Security vulnerabilities are out of scope.
