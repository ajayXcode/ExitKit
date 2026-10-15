# ExitKit Cloud: Security Plan

Status: draft v0.1. This plan covers the security of the **ExitKit product itself**. It is separate from the hackathon scoring note that security vulnerabilities in a *target* repository are out of scope for the analysis (ExitKit does not scan targets for CVEs). A hosted service that clones and runs customer code needs its own strong security posture.

## 1. Assets to protect
- Customer source code and capsules (may contain proprietary snippets and file paths).
- GitHub installation tokens and OAuth identity.
- API tokens, session cookies, share-link tokens.
- Model gateway keys and compute budget.
- Platform infrastructure and other tenants' data.

## 2. Trust boundaries and threat model

| # | Threat | Impact | Primary controls |
| --- | --- | --- | --- |
| T1 | **Untrusted repo code runs in checks** (tests, install scripts, smoke commands) and attempts escape, exfiltration or crypto-mining | Critical | One ephemeral sandbox per run (gVisor/microVM), no platform secrets, egress deny-by-default, CPU/memory/time/process limits, read-only base image, no shared volumes |
| T2 | **Prompt injection** via repo content (comments, strings) steering the model | High | Model has no tools or network; its output is data only; diffs applied with `git apply --check` inside the sandbox; claims verified by deterministic code; capsule labels all model text AI-GENERATED |
| T3 | Malicious diff from the model | High | Applied only in a disposable worktree in the sandbox; never auto-merged; PR creation is explicit, draft-only |
| T4 | Cross-tenant data access | Critical | Org-scoped authorisation on every route plus Postgres RLS; per-run credentials scoped to one repo; automated cross-tenant tests |
| T5 | Token theft (GitHub, API, session) | High | Short-lived installation tokens, hashed API tokens, httpOnly/Secure/SameSite cookies, rotation, revocation, secret scanning in logs |
| T6 | Share-link leakage or enumeration | Medium | High-entropy tokens, hashed at rest, expiry, revocation, no listing, noindex |
| T7 | XSS via model or repo text in the capsule viewer | High | Render all text as text (escape), diffs in text nodes, strict CSP, no `dangerouslySetInnerHTML` on capsule fields, schema-validate before storage |
| T8 | SSRF / network abuse from runners or gateway | High | Egress allow-list, block metadata and private ranges, DNS controls |
| T9 | Denial of service / cost abuse | Medium | Quotas, rate limits, concurrency caps, token budgets, max repo size and clone depth |
| T10 | Supply-chain compromise of the CLI or web dependencies | High | Lockfiles, pinned versions, dependency audit in CI, npm publish with provenance, minimal dependencies (CLI has zero runtime deps), review of new deps |
| T11 | Webhook forgery | Medium | HMAC signature verification, replay window, idempotency |
| T12 | Insider or operator access to customer code | High | Least-privilege ops access, access logging, no prompt/response body logging, data retention limits |
| T13 | Data exposure to the model provider | Medium | Send only usage snippets and footprint; self-host or choose a provider with a no-training/no-retention commitment; document in the privacy notice |

## 3. Sandbox specification (T1, T8)
- Isolation: gVisor or microVM; one job per sandbox; destroyed after the run.
- Filesystem: read-only image, tmpfs workspace with size cap, no host mounts.
- Network: default deny. Allow only (a) GitHub clone host for the pinned repo, (b) the model gateway, (c) package registries only when `--install` is explicitly enabled. Block link-local, metadata and RFC1918 ranges.
- Resources: per-check timeout (the CLI enforces 300s), overall wall-clock cap, memory, CPU, pids and output-size limits.
- Identity: non-root, dropped capabilities, seccomp profile, no privileged flags.
- Credentials: only a read-only clone token and a per-run model key, both expiring.
- Egress and escape tests run nightly (try metadata IP, other tenants, arbitrary hosts, fork bombs).

## 4. Application security
- Input validation with schemas on every endpoint; reject unknown fields.
- Output encoding and strict Content-Security-Policy; frame-ancestors none; referrer policy; HSTS.
- Parameterised queries via the ORM; no string-built SQL.
- Command execution only inside the sandbox; the CLI uses `shell: true` for check commands, so check commands from users are treated as untrusted code and never run on platform hosts.
- Path handling: capsule/verify code must stay within the checkout (the `schemas_file` verifier already rejects paths outside the repo; extend this to all file inputs).
- File upload (CLI push): size limit, JSON schema validation, provenance-rule validation, no rendering of unvalidated content.

## 4b. Capsule integrity
- Capsules are immutable after storage; hash recorded in the DB.
- The API re-applies provenance rules on upload so a client cannot mislabel AI text as OBSERVED/EXECUTED or add verdicts without ledger provenance.
- `exitkit verify` results are only evidence for what was reproduced; the UI never claims more than the capsule states.

## 5. Secrets and key management
- Managed secret store; no secrets in images, repos or logs.
- Encrypt stored tokens (envelope encryption with a managed KMS); rotate keys on a schedule and on incident.
- Separate credentials per environment; CI uses OIDC federation where possible.
- Pre-commit and CI secret scanning.

## 6. Data protection and privacy
- Data minimisation: clone at pinned commit, shallow; delete the clone when the run ends.
- Store only capsules, redacted logs and metadata. Do not log prompts, responses or file contents by default.
- Retention: capsules until deleted by the customer; logs 30 days (proposal); backups with defined expiry.
- Customer controls: delete a capsule, a repo, or the whole account; deletion cascades to storage and backups on the backup schedule.
- Encryption in transit (TLS 1.2+) and at rest.
- Publish a privacy notice describing the model provider path and that customer code is not used for training. Seek legal review for GDPR/other obligations; this plan is not legal advice.

## 7. Logging, monitoring, detection
- Structured logs with run_id and org_id; redact tokens and code content.
- Alerts: sandbox egress denials, repeated auth failures, unusual run volume, token-budget exhaustion, webhook signature failures.
- Immutable audit log for administrative and sharing actions.

## 8. Secure development lifecycle
- Threat-model review for each major feature; this document is updated with the feature.
- CI gates: tests, lint, `npm audit` or equivalent, container image scan, SAST.
- Dependency policy: prefer the standard library; justify every new dependency; pin and review updates.
- Mandatory code review; protected main branch; signed tags for releases.
- Pre-launch: independent penetration test focused on sandbox escape, authz and capsule viewer XSS.

## 9. Incident response
1. Detect and triage (severity levels, on-call).
2. Contain: revoke tokens and installations, disable runner pool, rotate keys.
3. Eradicate and recover from known-good images and backups.
4. Notify affected customers within legally required timelines; publish a post-incident review.
5. Add a regression test for the root cause.

## 10. Compliance posture
Not certified. Plan for SOC 2-style controls (access control, change management, logging, vendor review) before enterprise sales. Track subprocessors (cloud, model provider, GitHub).

## 11. Security acceptance checklist (before beta)
- [ ] Sandbox egress and escape tests pass in CI
- [ ] Cross-tenant access tests fail as required for every route
- [ ] Share links expire and can be revoked; no enumeration
- [ ] CSP in place; capsule viewer escapes all model and repo text
- [ ] No secrets in logs (automated scan)
- [ ] Webhook signatures verified; replays rejected
- [ ] Token hashing, rotation and revocation tested
- [ ] Data deletion verified end to end
- [ ] Pen test findings triaged

## 12. Known gaps today (CLI)
- `shell: true` execution means the CLI trusts the commands you give it and the repo's own tooling; run it in a container or VM on untrusted repos.
- Baseline checks run in the original checkout and can create files there (compile cache is redirected, but tests may write); use a clean clone for untrusted repos.
- Usage detection is pattern-based and can be fooled by comments or strings.
