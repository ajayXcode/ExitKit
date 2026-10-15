# Provenance rules

Every capsule entry carries exactly one tag.

| Tag | Meaning | Allowed sources |
| --- | --- | --- |
| OBSERVED | Read from files or registries | scan, risk, usages, checks (not_run records), capsule (computed gaps) |
| EXECUTED | Produced by a command that actually ran; command and exit code are stored | checks, patch |
| AI-GENERATED | Model output, unverified | ai |

Rules enforced in code (`src/provenance.js`):

1. A source may only emit tags it is allowed. The AI source can never emit OBSERVED or EXECUTED.
2. A `verdict` (CONFIRMED / REFUTED / UNVERIFIABLE) may only be attached by the ledger. A claim stays AI-GENERATED even when confirmed; the verdict says it survived a check.
3. An EXECUTED entry must carry the command and a numeric exit code.
4. Checks that could not run are recorded as `not_run` with a reason, never dropped.
