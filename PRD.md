# ExitKit Cloud: Product Requirements Document (PRD)

Status: draft v0.1 | Product: hosted SaaS built on the open-source ExitKit CLI/Agent Skill

## 1. Summary

ExitKit Cloud lets a team point at a repository, pick (or auto-select) a risky dependency, and receive a **Dependency Exit Capsule**: observed usage, an open-weight AI's exit plan, a per-claim verdict from code checks, a patch applied in an isolated worktree, and re-runnable evidence.

**Positioning line:** Other tools ask you to trust the AI's report. ExitKit shows you which of the AI's claims survived being checked.

The open-source CLI (`npx exitkit`) stays free and is the engine. The SaaS adds repo connection, hosted model + sandboxed runners, capsule history, sharing, team workflows and CI integration.

## 2. Problem

Teams know a dependency is risky but cannot quickly answer: where is it really used, how hard is it to leave, what would break, and can the AI's advice be trusted? Today the answers are scattered across grep, tribal knowledge and unverified AI chat output.

## 3. Users and jobs to be done

| Persona | Job | Pain today |
| --- | --- | --- |
| Maintainer / tech lead | Decide whether and how to leave a dependency | No evidence-backed estimate of effort |
| Platform / DevEx engineer | Run exits across many repos | Manual, inconsistent, unreviewable |
| Engineering manager | Justify and track migration work | Cannot see what is proven vs guessed |
| Reviewer / auditor | Check a proposed migration | Cannot separate AI claims from facts |

## 4. Goals and non-goals

**Goals (MVP)**
- G1. From a connected repo to a validated capsule without installing anything locally.
- G2. Every AI statement shown with a verdict (CONFIRMED / REFUTED / UNVERIFIABLE) and its evidence.
- G3. The capsule is re-runnable (`exitkit verify`) and exportable (JSON + Markdown).
- G4. Original repo never modified; changes live on a branch/worktree and optionally a draft PR.

**Non-goals (MVP)**
- Security vulnerability / CVE scanning (deliberately out of scope for the product's maintenance focus).
- Auto-merging changes.
- Model training or fine-tuning.
- Ecosystems beyond Python (pip) and JavaScript/TypeScript (npm).

## 5. Feature scope

### P0 (MVP)
1. **Sign in and connect repos** (GitHub): see AUTH_FLOW.md.
2. **New analysis wizard:** choose repo, ref, dependency (or "suggest"), optional extra smoke commands.
3. **Run pipeline in a sandbox:** scan, risk, usages/footprint, baseline checks, AI analysis, claim ledger, worktree patch, after-checks, capsule.
4. **Capsule viewer:** provenance badges, ledger table, diff, baseline-vs-after table, gaps and unresolved list.
5. **Run history** per repo and per dependency.
6. **Export:** download `capsule.json` / `capsule.md`; copy `exitkit verify` command.
7. **Private by default; share link** (revocable) for a single capsule.

### P1
- Draft pull request from the applied branch (explicit user action).
- CLI `exitkit login` and `exitkit push` to upload locally generated capsules.
- Team workspaces, roles, audit log.
- Scheduled re-scans and "exit difficulty changed" notifications.
- Choice of model from a vetted open-weight list; bring-your-own endpoint.

### P2
- GitHub Action / CI gate ("no new dependency without exit capsule").
- Fake-server runtime verification for LLM-SDK exits (currently a stretch goal in the CLI).
- Additional ecosystems.

## 6. Key user stories

- As a tech lead, I connect a repo and see ranked risky dependencies with file:line evidence so I can pick one.
- As a developer, I run an exit analysis and see which AI claims were refuted so I know what not to trust.
- As a reviewer, I open a shared capsule and re-run the recorded checks myself.
- As an admin, I revoke repo access and delete all stored data for a repo.

## 7. Success metrics

Targets below are proposals to be set after the first beta cohort; none are measured yet.

| Metric | Why |
| --- | --- |
| Time from repo connect to first capsule | Core value speed |
| % of runs producing a schema-valid capsule | Pipeline reliability |
| Claim verdict distribution (confirmed / refuted / unverifiable) per model | Honest model quality signal |
| % of capsules whose `verify` reproduces | Trust in evidence |
| Capsules shared or exported per active team | Collaboration value |
| Weekly active repos | Retention |

## 8. Pricing hypothesis (to validate)

Free: CLI + limited hosted runs. Team: higher run quota, history, sharing, PR creation. Enterprise: SSO, audit log, private model endpoint, data residency. Exact prices are undecided; compute cost per run (sandbox + model tokens) must be measured first.

## 9. Constraints and assumptions

- The open-weight model must be OpenAI-API-compatible; the exact model and its license are chosen after hardware/cost checks.
- Customer repositories are sensitive: no code is used for training; retention is limited and configurable (see SECURITY_PLAN.md).
- Running customer tests means executing untrusted code; this drives the sandbox design (see TRD.md).

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Small models return weak diffs or malformed JSON | Retry once, record failure in capsule, never hide; allow stronger model per plan |
| Many claims end UNVERIFIABLE | Grow verifier library; show the verdict honestly |
| Customer tests missing | Record `not_run`; suggest/generate smoke commands |
| Sandbox escape or data leak | See SECURITY_PLAN.md |
| Exit removes a feature users rely on (e.g. a provider option) | Capsule lists it as an unresolved tradeoff; human decides |

## 11. Open questions

1. Which open-weight model(s) at launch, and self-hosted vs hosted inference?
2. GitHub only at launch, or GitLab/Bitbucket too?
3. Is a draft-PR feature in MVP or P1?
4. Data residency requirements for early customers?
