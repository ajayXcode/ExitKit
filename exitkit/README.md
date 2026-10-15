# ExitKit 🚪⚡

**Exit risky dependencies safely with open-weight AI, deterministic claim verification, and reproducible Dependency Exit Capsules.**

[![Live Web Platform](https://img.shields.io/badge/Live%20Platform-exitkitt.vercel.app-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://exitkitt.vercel.app/)
[![npm version](https://img.shields.io/npm/v/exitkit?style=for-the-badge&color=blue&logo=npm)](https://www.npmjs.com/package/exitkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg?style=for-the-badge)](package.json)

---

> [!TIP]
> **Hosted Cloud Platform & Sandbox UI**: Visit **[https://exitkitt.vercel.app/](https://exitkitt.vercel.app/)** to explore real-time visual capsules, dependency health scoring, and shareable migration reports.

---

ExitKit audits a risky dependency, maps everywhere it is imported or called, asks an **open-weight** LLM for an exit plan as *checkable claims*, refutes those claims with code, applies the patch inside an isolated **git worktree**, re-runs checks, and writes a schema-validated, re-runnable **Dependency Exit Capsule**.

> **Other tools ask you to trust the AI's report. ExitKit shows you which of the AI's claims survived being checked.**

---

## 📦 Installation

```bash
# Run directly without installation
npx exitkit --help

# Or install globally
npm install -g exitkit
```

**Prerequisites:**
- Node.js 18+
- Git (`git --version`)
- Python 3.10+ (for Python repositories)
- Zero external runtime npm dependencies.

---

## ⚡ Quick Start

```bash
# 1. (Optional) Point to any local OpenAI-compatible endpoint (Ollama, vLLM, LM Studio)
export EXITKIT_BASE_URL="http://localhost:11434/v1"
export EXITKIT_MODEL="qwen2.5-coder-32b-instruct"
export EXITKIT_API_KEY="ollama"

# 2. Run full 9-step exit pipeline on target repo
npx exitkit run ./my-project --package anthropic --out ./out

# 3. Re-verify the recorded execution
npx exitkit verify ./out/capsule.json
```

*Note: Without a model configured, `exitkit run` still executes baseline checks and marks the AI analysis step safely as `not_run`.*

---

## 🛠️ Commands

| Command | Description |
| :--- | :--- |
| `exitkit run <repo> [--package <name>]` | Runs full 9-step pipeline and writes `capsule.json` + `capsule.md` |
| `exitkit scan <repo>` | Lists dependencies with file, line, and version bounds |
| `exitkit risk <repo> [--online]` | Scans maintenance signals (unbounded specs, vendor lock-in, stale) |
| `exitkit usages <repo> <package>` | Maps AST imports, call sites, and calculates exit footprint score |
| `exitkit checks <repo> [--install]` | Executes baseline compile and test suite |
| `exitkit analyze <repo> <package>` | Queries open-weight model for plan, diff, and checkable claims |
| `exitkit ledger <repo>` | Cross-examines AI claims with deterministic code verifiers |
| `exitkit patch <repo>` | Applies diff in isolated git worktree without touching main branch |
| `exitkit capsule <repo>` | Builds and schema-validates `capsule.json` and `capsule.md` |
| `exitkit verify <capsule.json>` | Re-runs recorded commands at the recorded commit in sandbox |

---

## 🛡️ The Provenance Guarantee

Every entry in an ExitKit Capsule is tagged with an immutable provenance tier enforced in code (`src/provenance.js`):

- **`[OBSERVED]`**: Extracted directly from files or AST. Cannot be emitted by the model.
- **`[EXECUTED]`**: Real command run in the repo. Records exact command string, exit code, duration, and output SHA-256.
- **`[AI-GENERATED]`**: Model hypotheses. Unverified unless accompanied by a deterministic ledger verdict (`CONFIRMED`, `REFUTED`, or `UNVERIFIABLE`).
- **Real Verification**: A change is only marked `verified` if git apply succeeded in the worktree, after-checks executed without errors, and no regressions occurred.

---

## 🤖 Agent Skill

ExitKit includes `SKILL.md` for native pairing with AI agents:
- **Codex**: Implementation & Code Review
- **Claude**: Adversarial Review
- **Antigravity**: Primary Builder & Worktree Orchestrator

---

## 🧪 Testing

```bash
npm test
```

18 automated tests covering end-to-end pipelines, command security validation, malformed capsule rejection, schema validation, and ledger verification.

---

## 📄 License

MIT © [Ajay Yadav](https://github.com/ajayXcode)

