# ExitKit

Exit a risky dependency safely. ExitKit finds the dependency worth leaving, maps how the code uses it, asks an **open-weight** model for an exit plan as *checkable claims*, tries to refute those claims with code, applies the change in a **git worktree**, re-runs checks, and writes a re-runnable **Dependency Exit Capsule**.

> Other tools ask you to trust the AI's report. ExitKit shows you which of the AI's claims survived being checked.

## Install

```bash
npx exitkit --help          # no install
npm i -g exitkit            # or global
```

Requires Node.js 18+ and git. Zero runtime dependencies.

## Quick start

```bash
export EXITKIT_BASE_URL=http://localhost:11434/v1   # Ollama; vLLM works too (use another port than your app)
export EXITKIT_MODEL=<your-open-weight-model>
export EXITKIT_API_KEY=ollama

exitkit run ./target-repo --package anthropic --out ./capsule
exitkit verify ./capsule/capsule.json
```

Without a model configured, `run` still works: the AI step is recorded as `not_run` and the capsule says so.

## Commands

`run`, `scan`, `risk`, `usages`, `checks`, `analyze`, `ledger`, `patch`, `capsule`, `verify`. See `exitkit --help`.

## What the capsule guarantees

- Every entry is tagged OBSERVED, EXECUTED or AI-GENERATED, enforced in code (`src/provenance.js`).
- Verdicts (CONFIRMED / REFUTED / UNVERIFIABLE) come only from the claim ledger.
- Changes are tracked as proposed, applied, verified. The original checkout is never edited.
- Checks that could not run are `not_run` with a reason.
- `exitkit verify` re-runs recorded commands at the recorded commit and compares exit codes and normalized output.

## Limitations

- Usage detection is line-based pattern matching, not a full AST. It misses multi-line imports and instance-method calls.
- Only `only_used_in` and `schema_compat` claims are verified automatically. The fake-server runtime check is not implemented, so those claims are UNVERIFIABLE.
- Small local models may return malformed JSON or weak diffs. Failures are recorded in the capsule, not hidden.
- Security vulnerabilities (CVEs) are intentionally out of scope.
- Choose your model yourself and check its license and hardware needs.

## Development

```bash
npm test
npm pack --dry-run
```

MIT licensed.
