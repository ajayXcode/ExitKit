# ExitKit: Implementation Plan

Status: draft v0.1. Durations are rough estimates for a small team and must be re-planned after the first spike results.

## 0. Where things stand

| Item | State |
| --- | --- |
| CLI (Node, zero dependencies): scan, risk, usages, checks, analyze, ledger, patch, capsule, verify, run | Built; 15 tests pass (unit + end-to-end with a mock model server) |
| npm packaging (bin, files, engines, `npm pack`) | Built; tarball generated |
| SKILL.md (agentskills.io format) | Written; must be validated against the current standard before submission |
| CI + publish workflows (npm provenance) | Written; not yet run on GitHub |
| Capsule schema + provenance rules | Built and enforced in code |
| Run against the real demo target (hermes-skill-deck) with a real open-weight model | **Not done** |
| Fake-server runtime verifier, AST-based Python usage scan, `login`/`push` | Not built |
| SaaS (web app, GitHub App, sandboxed runners) | Not started; specified in PRD/TRD/AUTH/SECURITY |

## 1. Phase 1: Hackathon finish (CLI as the deliverable)

Goal: a convincing, honest demo and a clean submission.

1. Pick and install the open-weight model runtime (Ollama or vLLM); record model name, license and hardware notes in the README.
2. Clone the target repo and run `exitkit run` end to end; keep the real capsule as the demo artifact.
3. Read the target files not yet inspected (package.json, server.py, src-tauri) and correct the maintenance problem statement if needed.
4. Check that the SKILL.md frontmatter and folder name satisfy the current agentskills.io spec.
5. If time allows, in this order: fake-server runtime check (SSE chunks, because the target streams), stronger Python usage detection, extra smoke command for `/api/health`.
6. Record the demo: show observed evidence, the ledger with at least one honest REFUTED/UNVERIFIABLE result, baseline vs after, then `exitkit verify`.
7. Publish: `npm publish` (or submit the tarball), repo README, requirement-to-evidence table (see BUILD guide section 16).

Exit criteria: real capsule exists; `exitkit verify` passes on it; README states limitations.

## 2. Phase 2: Harden the engine (about 2 to 3 weeks)

- Python usage detection via a small Python helper using `ast` (keep regex as fallback); JS via a real parser.
- Verifier library: `schema_compat` against real conversions, `runtime_behavior` via fake OpenAI-compatible server, new claim types from observed model output.
- Prompt and model evaluation harness: golden repos, per-model claim accuracy tables.
- Checks: smoke-command templates, timeouts, output size caps.
- Capsule schema 1.0 freeze and a compatibility test suite.

## 3. Phase 3: SaaS MVP (about 6 to 8 weeks)

| Week | Deliverable |
| --- | --- |
| 1 | Sandbox spike (gVisor vs microVM vs managed): run `exitkit run` on a sample repo with egress deny; decision record |
| 1-2 | Next.js app skeleton, tokens and fonts from the UI spec, Postgres schema + RLS, CI/CD, staging environment |
| 2-3 | GitHub sign-in and GitHub App installation, org/role model, audit log |
| 3-4 | Queue + runner service, per-run credentials, model gateway, capsule storage and validation |
| 4-5 | Repo and dependency screens, analysis wizard, run progress, capsule viewer (badges, ledger, diff, verification) |
| 5-6 | Export, share links, retention and delete flows, rate limits and quotas |
| 6-7 | Security review items from SECURITY_PLAN.md, sandbox escape tests, load test, accessibility audit |
| 7-8 | Private beta with a few real repositories; fix list; marketing footer page per spec |

Exit criteria: a stranger can sign in, connect a repo, get a schema-valid capsule, share it, and delete their data; cross-tenant access tests all fail as required; sandbox egress tests pass.

## 4. Phase 4: Beta to GA

- CLI `login`/`push`, draft PR creation, team roles UI, scheduled re-scans.
- Billing and quotas from measured cost per run.
- Status page, on-call, backup restore drill, incident runbook.
- Optional: GitHub Action for CI gating, more ecosystems.

## 5. Work breakdown by area

| Area | Key tasks |
| --- | --- |
| Engine | AST helpers, verifiers, claim schema, evaluation harness |
| Platform | Queue, runners, gateway, storage, observability |
| Web | Auth flows, wizard, capsule viewer, marketing footer |
| Security | Sandbox, secrets, RLS tests, threat-model upkeep |
| Docs and community | README, CLI docs, examples, contribution guide |

## 6. Testing and quality gates
- Every PR: unit tests, lint, dependency audit.
- Nightly: golden-capsule regression, sandbox-escape suite, cross-tenant tests.
- Release: `npm pack` check, provenance-enabled publish, schema compatibility test.

## 7. Risks to schedule and mitigation

| Risk | Mitigation |
| --- | --- |
| Sandbox effort larger than expected | Do the spike first; fall back to a managed sandbox provider |
| Model quality too low | Evaluation harness early; allow stronger model per plan; keep honest verdicts |
| Cost per run too high | Measure in staging; cap tokens, concurrency and run time |
| Scope creep (more ecosystems) | Python + JS only until GA |
| Spec gaps for the footer (icons, copy) | Resolve with the owner before the marketing build |

## 8. Immediate next actions (this week)
1. Run the CLI on the real target with a real open-weight model.
2. Decide model, runtime, and record license.
3. Supply the three social icon SVGs and approve footer copy.
4. Start the sandbox spike.
