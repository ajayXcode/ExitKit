---
name: exitkit
description: Audits one risky or outdated dependency in a repository, maps every usage, gets an exit plan from an open-weight model as checkable claims, verifies those claims with code, applies the change in a git worktree, re-runs checks, and writes a Dependency Exit Capsule that separates observed, executed and AI-generated information. Use when asked to assess, replace or remove a dependency.
license: MIT
compatibility: Needs Node.js 18+, git, and for the AI step an OpenAI-compatible endpoint serving an open-weight model (EXITKIT_BASE_URL, EXITKIT_MODEL). Python or Node projects.
---

# ExitKit Agent Skill

ExitKit safely audits and migrates a risky or proprietary dependency in a codebase. It generates an atomic exit plan and unified diff from an open-weight LLM, deterministically verifies AI claims against real code, applies the patch inside an isolated git worktree without touching the original working tree, and generates a schema-validated **Dependency Exit Capsule** (`capsule.json` and `capsule.md`).

---

## 1. Prerequisites & Environment Verification

Before running ExitKit commands, verify the execution environment:

1. **Node.js**: Requires Node.js >= 18 (`node -v`).
2. **Git**: Requires Git in PATH (`git --version`) and the target repo must be a valid git repository (`git rev-parse --is-inside-work-tree`).
3. **Ecosystem Tooling**:
   - For Python repositories: Python runtime (`python3` or `python`), pip, and optionally `pytest` for test suites.
   - For Node repositories: `npm` and standard Node modules.
4. **Local / Open-Weight LLM Gateway** (Optional for steps 1-4, required for steps 5-6):
   - `EXITKIT_BASE_URL`: OpenAI-compatible endpoint (e.g. `http://localhost:8000/v1` or `http://localhost:11434/v1`).
   - `EXITKIT_MODEL`: Open-weight model identifier (e.g. `qwen2.5-coder-32b-instruct`, `deepseek-coder-v2`, `llama-3.1-70b-instruct`).
   - `EXITKIT_API_KEY`: API key if gateway requires authentication (default: dummy value).
   - *Note*: If model variables are not set, step 5 safely records `status: not_run` and proceeds without crashing.

---

## 2. Path Resolution & Working Directory

- **Repo Path**: Always provide the target repository path (absolute path or relative to current working directory).
- **Working Directory (`--work <dir>`)**: Intermediate execution artifacts are stored in `--work <dir>` (default: `<repo>/.exitkit` or local `.exitkit`).
- **Capsule Output (`--out <dir>`)**: Final capsules (`capsule.json` and `capsule.md`) default to the working directory unless specified otherwise.
- **Repository Safety**: The target repository's current branch is never modified. All diffs are applied in an isolated git worktree (`../<repo>-exitkit-wt`).

---

## 3. Failure Handling & Safe Stopping Rules

Each step in ExitKit depends on validated outputs from preceding steps. When running steps individually, **STOP safely if any prerequisite step fails or its output file is missing**:

| Step | Command | Required Input Artifact | Output Artifact | Stop Condition |
| :--- | :--- | :--- | :--- | :--- |
| **1. Scan** | `npx exitkit scan <repo>` | Manifest (`requirements*.txt`, `package.json`) | `deps.json` | Abort if no dependencies found |
| **2. Risk** | `npx exitkit risk <repo>` | `deps.json` | `risk.json` | Abort if `deps.json` missing |
| **3. Usages** | `npx exitkit usages <repo> <pkg>` | `deps.json` | `usages.json`, `meta.json` | Abort if package not found |
| **4. Checks** | `npx exitkit checks <repo>` | Target repository | `baseline.json` | Record baseline check results |
| **5. Analyze**| `npx exitkit analyze <repo> <pkg>`| `usages.json` | `claims.json`, `patch.diff` | Model error or missing usages |
| **6. Ledger** | `npx exitkit ledger <repo>` | `claims.json`, `usages.json` | `ledger.json` | Abort if claims missing |
| **7. Patch** | `npx exitkit patch <repo>` | `meta.json`, `patch.diff` | `patch.json`, `after.json` | Abort if git worktree fails |
| **8. Capsule**| `npx exitkit capsule <repo>` | All previous JSON artifacts | `capsule.json`, `capsule.md`| Schema validation fails |
| **9. Verify** | `npx exitkit verify <capsule>` | Valid `capsule.json` | Terminal verification report | Hash mismatch or failed checks |

---

## 4. Execution Workflow

### Option A: Complete Pipeline (Recommended)
Run the full 9-step pipeline in a single automated command:
```bash
npx exitkit run <repo-path> --package <dependency-name>
```
Flags:
- `--package <name>`: Target package to exit (if omitted, ExitKit selects the highest-risk dependency).
- `--work <dir>`: Directory for intermediate files (default `.exitkit`).
- `--out <dir>`: Directory for final `capsule.json` and `capsule.md`.
- `--install`: Execute package installation during checks.
- `--cmd "<smoke-command>"`: Additional smoke command to verify before and after.
- `--json`: Output full JSON results.

### Option B: Step-by-Step Invocation
1. `npx exitkit scan <repo>`: Scans manifests and checks version bounds.
2. `npx exitkit risk <repo> [--online]`: Evaluates maintenance signals (no CVEs).
3. `npx exitkit usages <repo> <package>`: Maps call sites, symbols, and exit footprint.
4. `npx exitkit checks <repo> [--install]`: Records baseline compile and test checks.
5. `npx exitkit analyze <repo> <package>`: Prompts local model for atomic claims and unified diff.
6. `npx exitkit ledger <repo>`: Deterministically tests AI claims against codebase (CONFIRMED / REFUTED / UNVERIFIABLE).
7. `npx exitkit patch <repo>`: Applies patch in isolated git worktree and runs `after` checks.
8. `npx exitkit capsule <repo>`: Assembles and schema-validates `capsule.json` and `capsule.md`.
9. `npx exitkit verify .exitkit/capsule.json`: Replays recorded commands in a clean temporary checkout and verifies hash equivalence.

---

## 5. Strict Provenance Rules

- **OBSERVED**: Data directly read from repository files (manifests, AST, file paths).
- **EXECUTED**: Real commands executed with return code, duration, and output hash recorded.
- **AI-GENERATED**: Model output, unverified unless accompanied by a deterministic ledger verdict.
- **Truthful Status**: `proposed_changes.status` is only `'verified'` if the patch applied cleanly in the worktree, after-checks executed without regressions, and no check failed. Missing tests are marked as `not_run`, never hidden.

---

## 6. Agent Pair-Programming Roles

- **Antigravity (Builder)**: Executes the CLI pipeline, verifies local model connectivity, ensures clean command exits, and binds dashboard endpoints to real execution.
- **Codex (Implementation & Tests)**: Inspects code structure, runs `npm test`, validates schema fidelity, and confirms intermediate JSON contracts.
- **Claude (Adversarial Review)**: Challenges assumptions, ensures command inputs are sanitized, validates that untrusted capsules cannot trigger arbitrary shell commands, and checks that refuted claims or gaps are prominently flagged.
