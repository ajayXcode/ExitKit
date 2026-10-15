# ExitKit Master Document

Hackathon Track 2 (Maintenance Agent Skill) | Demo target: runninwithitmarketing/hermes-skill-deck

This is the single master document for ExitKit. Part A (sections 1 to 13) is the solution overview. Part B covers the Track 2 brief and terms, Part C the review of the DepGuard plan, Part D the decisions on the CLI, a MERN dashboard and AI coding tools, Part E the step-by-step build guide with code sketches, Part F how to perform the build, Part G the submission checklist and open items, Part H the Agent Skills checklist with unique additions and reasons, and Part I the fixes adopted from an independent architecture review. The earlier separate review and build-guide docs are merged here.

## 1. What we are building

ExitKit is an **Agent Skill** (agentskills.io format) that performs one maintenance job on any repository: **exiting a risky dependency safely**. It finds the dependency worth leaving, maps exactly how the code uses it, asks an open-weight AI model for an exit plan, cross-checks the AI's claims with code, applies the change in an isolated git worktree, re-runs checks, and produces a **Dependency Exit Capsule** that another person or agent can reuse and re-verify.

The skill is repo-agnostic. The organizer's repository (Hermes Skill Deck) is the demonstration target, not something hardcoded into the tool.

## 2. The problem it solves

Teams know a dependency is risky but cannot answer: where is it really used, how hard is it to leave, what would break, and can we trust the AI's advice? ExitKit answers those four questions with evidence.

**Demo problem for the target repo** (from reading its README, requirements.txt and agent.py): exit the proprietary anthropic SDK path in agent.py and make a local open-weight model work through the OpenAI-compatible route the repo already uses. Observed signals: anthropic and openai have no upper version bound, model IDs are hardcoded, and only \_run\_anthropic uses the Anthropic SDK while \_run\_openai already accepts a base\_url.

Security vulnerabilities are out of scope because they earn no points, so ExitKit uses maintenance signals only.

## 3. What makes it different

The difference below is my judgment of the typical pipeline (scan, ask AI, patch, test, report). I cannot see what other teams are building.

| Typical approach | ExitKit |
| --- | --- |
| AI writes a report and the human must trust it | AI answers in atomic claims, and code tries to refute each one (the Claim Ledger) |
| Observed and AI content separated by headings | Provenance tags enforced in code: the capsule builder refuses to label AI output as observed or executed |
| Report says a dependency is hard to remove | Exit Footprint Map gives symbols, call sites and an Exit Difficulty score |
| Static report file | Re-runnable capsule: a verify command repeats the executed checks |
| Patch edited straight into the repo | Change applied in a disposable git worktree, with proposed, applied and verified tracked separately |
| Failures hidden or skipped silently | Refuted claims, failed checks and not\_run checks (with reasons) are shown prominently |

## 4. Unique selling point (USP)

**Other tools ask you to trust the AI's report. ExitKit shows you which of the AI's claims survived being checked.**

Three supporting points:

1. **Cross-examined AI.** Claim accuracy is reported per model, for example 9 claims: 6 confirmed, 1 refuted, 2 unverifiable.
2. **Enforced honesty.** The provenance rule is code, not a label convention.
3. **Portable evidence.** The capsule is schema-validated JSON plus Markdown, and can be re-run by a judge or another agent in one command.

## 5. Core features

1. **Dependency scanner and maintenance risk scoring.** Reads manifests and lockfiles, and flags unbounded versions, vendor lock-in, hardcoded model IDs and (when online) stale or deprecated packages. No CVEs.
2. **Usage locator and Exit Footprint Map.** AST-based search for every import and call site with file and line, plus the number of distinct symbols used and an Exit Difficulty score (with the formula stated in the capsule).
3. **Baseline verification engine.** Detects and runs install, compile, import, test and smoke checks before any change, recording command, exit code, output hash and not\_run reasons (for example no tests found).
4. **Open-weight AI analyst.** A local model through an OpenAI-compatible endpoint returns a plan, a diff and structured claims, using only the repository's usage snippets as context.
5. **Claim Ledger.** Deterministic verifiers (usage scan, schema validation, and a fake-server runtime check as a stretch goal) mark each claim CONFIRMED, REFUTED or UNVERIFIABLE.
6. **Safe migration in a worktree.** The patch is checked with git apply --check, applied only in a separate worktree, then re-verified. The original checkout is never edited.
7. **Provenance-enforced capsule builder.** Every entry is tagged OBSERVED, EXECUTED or AI-GENERATED, and the builder rejects wrong combinations.
8. **Re-runnable capsule.** The verify command re-runs the recorded commands at the recorded commit and compares exit codes and normalized output.

## 6. Tech stack

Choices are suggestions. Check each license and your hardware before committing.

| Layer | Choice | Why |
| --- | --- | --- |
| Language | Python 3.10+ | Matches the target's backend and the standard library covers most needs |
| Skill format | SKILL.md plus scripts, references and assets (agentskills.io) | Required if submitting an Agent Skill |
| Code analysis | ast (Python), simple text search for other files | Finds nested imports and call sites reliably |
| Command execution | subprocess with timeouts | Records exact commands and exit codes |
| Isolation | git worktree and branch | Reviewable, reversible changes |
| AI model | An open-weight coding model such as Qwen2.5-Coder, DeepSeek-Coder or Llama 3.x | Meets the open-weight requirement; verify the exact model license and tool or JSON support |
| Model runtime | Ollama or vLLM, called through the openai Python client with a base URL | Same client style the target already uses, so the exit is easy to demonstrate |
| Validation | jsonschema | Validates capsules and checks tool schemas |
| Tests | pytest | Tests the scanner, provenance rule, schema and verifiers |
| Capsule format | JSON plus Markdown | Machine-readable and human-readable |
| Optional | Show the skill loading in Hermes Agent, or a small HTML view of the capsule | Demonstrates standard compliance; keep it optional |

## 7. Complete workflow

| Step | What happens | Tag |
| --- | --- | --- |
| 1. Scan | Parse manifests and lockfiles into a dependency list with file and line | OBSERVED |
| 2. Score | Compute maintenance signals and rank dependencies | OBSERVED |
| 3. Select | Pick the top-risk dependency, or the one the user names | OBSERVED |
| 4. Locate | Find all usages and build the footprint map | OBSERVED |
| 5. Baseline | Run install, compile, import, test and smoke checks on the original checkout | EXECUTED |
| 6. Analyse | Model returns a plan, a diff and typed claims | AI-GENERATED |
| 7. Cross-examine | Verifiers mark each claim CONFIRMED, REFUTED or UNVERIFIABLE | Verdict from code |
| 8. Apply | git apply --check, then apply in a worktree | EXECUTED |
| 9. Re-verify | Run the same checks on the worktree and compare with the baseline | EXECUTED |
| 10. Report | Build and schema-validate capsule.json and capsule.md | Mixed, tagged per entry |
| 11. Prove | Run the verify command on the capsule | EXECUTED |

## 8. What the Dependency Exit Capsule contains

These map to the list in the brief.

1. Maintenance problem identified
2. Repository and dependency details (name, commit hash, schema version)
3. Risk indicators with evidence
4. Usage locations
5. AI analysis and recommendations, with Claim Ledger verdicts
6. Proposed changes (diff), with status proposed, applied or verified
7. Suggested tests and verification steps
8. Executed results: baseline versus after, with commands and exit codes
9. Compatibility and maintenance gaps
10. Unresolved concerns and limitations, including checks that were not run and why

## 9. How it meets the Track 2 requirements

| Requirement | Where ExitKit delivers it |
| --- | --- |
| Open-source or open-weight AI used meaningfully | Local open-weight model produces the plan, diff and claims |
| Follows the Agent Skills standard | SKILL.md plus scripts, references and assets |
| Identifies a specific maintenance problem | Dependency exit, with risk indicators from the repo |
| Uses the repo's real code, dependencies and tests | Manifest parsing, AST usage scan, real check runs |
| Runs tests or checks | Baseline and after runs with recorded commands and exit codes |
| Identifies errors, gaps and risks | Refuted claims, failed and not\_run checks, gaps and unresolved sections |
| Separates AI from observed or verified | Enforced provenance tags and the Claim Ledger |
| Produces a Dependency Exit Capsule | JSON and Markdown, schema validated, re-runnable |
| Original contribution beyond an existing agent | New skill, ledger, provenance enforcement, footprint map and verify workflow |

## 10. Scope: must-have and stretch

**Must-have:** SKILL.md and schema, scanner, usage locator, baseline checks, AI claims, usage and schema verifiers, worktree patch, provenance-enforced capsule, tests for the tool, and a real capsule from the target repo.

**Stretch (cut in this order, last item first):** footprint map and Exit Difficulty score, verify command, fake-server runtime check, seam-first migration (a thin adapter at the dependency boundary with contract tests).

## 11. Demo plan

1. Show the target and the problem.
2. Run the scan, risk score and usage locator, and show the observed evidence.
3. Show the model's claims and the ledger, including any honest REFUTED or UNVERIFIABLE result.
4. Show baseline versus after check results.
5. Open the capsule, then run the verify command.
6. Map the result to the requirement table.

## 12. Honest limitations

- The target appears to have no tests, so verification relies on smoke checks the skill adds.
- Small local models may return malformed JSON or weak patches, so every claim and diff is checked, not trusted.
- Only some claim types can be verified automatically, so some claims will remain UNVERIFIABLE.
- Exiting the anthropic SDK removes Claude as a selectable provider in the target app, which is a tradeoff and not a pure improvement.
- package.json, server.py and src-tauri in the target were not inspected during planning, and no ExitKit code has been run yet.

## 13. One-line pitch

ExitKit turns a dependency exit from an opinion into evidence: an open-weight AI proposes the way out, code checks what it claimed, and a re-runnable capsule records what was observed, what was executed and what is still unproven.

## Part B: The Track 2 brief and terms

### B1. What the track asks for

Build a reusable AI tool that performs one maintenance job on the organizer-provided repository, then produce a report of what it found and did. It can be an Agent Skill, a custom AI tool, an automated workflow, or a meaningful extension to an existing open-source agent.

The seven requirements:

1. Identify and understand a specific software-maintenance problem in the repository.
2. Perform a clearly defined maintenance task using the repo's actual code, dependencies, configuration or tests.
3. Use AI meaningfully to analyse the problem, recommend, or help carry out the task.
4. Where feasible, run tests or checks to validate the result.
5. Identify errors, compatibility gaps, unresolved risks or limitations from the observed results.
6. Clearly distinguish AI-generated recommendations from information actually observed or verified.
7. Generate a reusable Dependency Exit Capsule with the findings, actions, evidence and maintenance information.

Other rules: the AI must be open-source or open-weight (no training or fine-tuning needed); an Agent Skill must follow the agentskills.io standard; and simply deploying an existing agent, changing its prompt or changing its UI is not enough, so something new must be added.

### B2. Terms the brief does not define

These are interpretations, since the brief does not spell them out.

| Term | Meaning |
| --- | --- |
| Track 2 | A category label. The hackathon has several tracks, and this is the second |
| Maintenance | Keeping existing software healthy instead of building new features |
| Dependency | An external library or package the project relies on |
| Dependency exit | Getting off a dependency by removing or replacing it safely |
| Capsule | A self-contained report that lets someone else continue the work without redoing it |
| Agent Skill | A folder with a SKILL.md file (plus optional scripts) that teaches an AI agent one task |

### B3. Scoring note and risk signals

Security vulnerabilities in the target repository earn no points and are not to be considered for now. ExitKit therefore uses no CVE or advisory data and the capsule has no security section; at most it carries a one-line note that security was out of scope on purpose.

Maintenance signals used instead: deprecated or archived packages, unmaintained packages, outdated or unbounded version pins, use of removed or deprecated APIs, license concerns, heavy footprint for small use, compatibility drift with the runtime, and vendor lock-in with hardcoded model identifiers.

### B4. What was observed in the target repo

These points come from the README, requirements.txt and agent.py only. Nothing was executed, and package.json, server.py and src-tauri were not opened.

- requirements.txt lists fastapi, uvicorn\[standard\], PyYAML, anthropic (>=0.40), openai (>=1.40) and python-dotenv.
- anthropic and openai have no upper version bound, while fastapi, uvicorn and PyYAML do.
- agent.py hardcodes a model registry, and the README calls the model strings best-effort defaults.
- Only \_run\_anthropic uses the Anthropic SDK. \_run\_openai already takes a base\_url and serves DeepSeek and Z.ai, and it calls the API with stream=True.
- agent.py defines five tools: search\_skills, list\_categories, fetch\_skill\_content, create\_skill and delete\_skill.
- The stack is a Python (FastAPI) backend, a React and Vite frontend and a Tauri shell. It is not a MERN project.
- No test files appear in the top-level listing.

## Part C: Review of the DepGuard plan

Another plan (DepGuard AI) was reviewed. It is essentially the same scan, plan, patch, test, report pipeline with a polished presentation, so it is the crowd approach this project is trying to avoid.

### C1. Where it falls short

- It does not know the target repo and ends by saying the design depends on what the organizers provide, although the target is already known.
- It contradicts the scoring note: it lists known advisories as a risk signal, but vulnerabilities earn no points.
- It labels facts and hypotheses in separate lists but never checks the AI's claims. This is the gap the Claim Ledger fills.
- Its image link (BISO, Your Codebase's Immune System) has nothing to do with the plan.
- The framing is generic, and a judge will have seen it many times.

### C2. Ideas worth keeping

| Idea | Why it helps |
| --- | --- |
| Capsule fields: schema\_version, repo commit hash, evidence references per finding | Makes the capsule reproducible and reusable |
| Verification split into passed, failed and not\_run, with the reason | An honest record of what could not run |
| Separating proposed, applied and verified changes | Keeps the migration status clear |
| Applying changes in a disposable git worktree | Safer than editing the repo directly |
| Tests for the tool itself | Shows engineering quality |
| Python plus a custom state machine, no heavy framework | Right size for a hackathon |

## Part D: Decisions on the CLI, MERN and AI coding tools

### D1. A thin CLI: yes, after the core works

A small CLI helps the demo and is needed for the verify command. Keep it to one Python file using argparse with three subcommands (run, scan and verify) that only call the existing scripts. The scripts must still work standalone, because the Agent Skill format depends on them. Do not build menus or config files, and do not count the CLI as the original contribution. Build it after phases A to G in Part F, in about an hour, and skip it if time is short. It belongs to ExitKit, not to the target repo.

### D2. MERN: optional dashboard only

MERN is not required by Track 2 and the target repo is not MERN. A pure-Node core is a poor fit because the most reliable part of the plan is the Python ast usage scan, and parsing Python from Node means tree-sitter or shelling out to Python anyway. If the team wants MERN, use it as a product layer on top of the Python engine:

| Part | Role |
| --- | --- |
| MongoDB | Stores runs, capsules and ledger results (plain capsule.json files are a lower-effort alternative) |
| Express and Node | API that starts the Python scripts with child\_process and serves capsules |
| React | Dashboard: capsule viewer, claim ledger table with verdict badges, provenance filter, baseline versus after results |

Risks: MongoDB adds setup for anyone running the demo and takes time from the core. Build the dashboard only after the capsule, ledger and provenance checks work. A static HTML capsule viewer is a cheaper fallback.

### D3. Freebuff CLI and Antigravity

Freebuff's GitHub page says it installs with npm install -g freebuff and is free, with a model catalog and session limits shown before you start. It is built on the open-source Codebuff framework. Antigravity is, as far as I know, Google's agent-first IDE; check its current limits and terms yourself. Suggested split: use Freebuff to generate the scripts one step at a time from Part E (one step per prompt), and Antigravity for review, running tests and the React dashboard.

Two cautions. First, the AI that writes your code does not count for the Track 2 requirement: ExitKit itself must call an open-weight model (Ollama or vLLM) at runtime. Second, treat generated code as unreviewed: run pytest, read every diff and commit after each step. Read each tool's data-use notice before pasting anything private.

## Part E: Step-by-step build guide

This part is a plan with code sketches. None of the code has been run, so test each step as you build it.

### E0. Decide before coding

Pick the model runtime (Ollama or vLLM), the exact model name (it must follow JSON instructions reliably and run on your hardware), and check its license. Confirm the model's tool or JSON support on its page.

### E1. Environment setup

```
git clone https://github.com/runninwithitmarketing/hermes-skill-deck target-repo
python3 -m venv .venv && source .venv/bin/activate
pip install openai jsonschema pytest
mkdir -p exitkit/scripts exitkit/references exitkit/assets tests/fixtures work
```

Point the tool at the local model (Ollama example):

```
ollama pull <model-name>
export EXITKIT_BASE_URL=http://localhost:11434/v1
export EXITKIT_MODEL=<model-name>
export EXITKIT_API_KEY=ollama
```

Port note: the target's dev backend uses port 8000, so if you serve with vLLM, pick another port such as 8001.

### E2. Folder layout

```
exitkit/
├── SKILL.md
├── scripts/   scan_deps.py  risk_score.py  find_usages.py  run_checks.py
│              ai_analyze.py  verifiers.py  apply_patch.py  build_capsule.py  verify.py
├── references/  capsule-schema.json  provenance-rules.md
└── assets/  capsule-template.md
tests/   test_scan.py  test_provenance.py  test_schema.py  test_verifiers.py  fixtures/
```

Work files (deps.json, usages.json, claims.json, results) go in work/, so each step reads the previous step's output and the whole run is reproducible.

### E3. SKILL.md

Create this first, because it fixes the interface of every script. Check the field rules against the current agentskills.io spec before submitting: name must be lowercase with hyphens and match the folder name, and description must say what the skill does and when to use it.

```
---
name: exitkit
description: Audits one risky or outdated dependency in a repository, maps every usage, tests an exit or upgrade plan produced by an open-weight model, and writes a Dependency Exit Capsule that separates observed, executed and AI-generated information. Use when asked to assess, replace or remove a dependency.
license: MIT
compatibility: Needs Python 3.10+, git, and an OpenAI-compatible endpoint serving an open-weight model.
---
# ExitKit

## Steps
1. python scripts/scan_deps.py <repo> > work/deps.json
2. python scripts/risk_score.py <repo> work/deps.json > work/risk.json
3. python scripts/find_usages.py <repo> <package> > work/usages.json
4. python scripts/run_checks.py <repo> > work/baseline.json
5. python scripts/ai_analyze.py work/usages.json > work/claims.json
6. python scripts/verifiers.py <repo> work/claims.json work/usages.json > work/ledger.json
7. python scripts/apply_patch.py <repo> work/claims.json
8. python scripts/run_checks.py <worktree> > work/after.json
9. python scripts/build_capsule.py work/ --out capsule

Read references/provenance-rules.md before writing the capsule.
```

### E4. Capsule schema

Write references/capsule-schema.json (JSON Schema) before the scripts and validate against it in build\_capsule.py. Required top-level fields:

| Field | Contents |
| --- | --- |
| schema\_version | A fixed string such as 1.0 |
| repository | name, commit hash (from git rev-parse HEAD), analysed path |
| maintenance\_problem | Short statement of the problem and the dependency |
| risk\_indicators | Entries with tag, text and evidence (file and line) |
| usage\_locations | file, line, symbol |
| footprint | Symbols used, call-site count, exit difficulty score and the formula |
| ai\_analysis | Claims with id, statement, type, and a verdict from the ledger |
| proposed\_changes | Diff plus a status: proposed, applied or verified |
| verification | Commands executed with exit code and output hash; passed, failed and not\_run lists (with reasons) |
| gaps | Compatibility and maintenance gaps |
| unresolved | Open concerns and limitations |

Every entry carries a tag of OBSERVED, EXECUTED or AI-GENERATED. Verdicts are stored separately and can only come from the verifiers.

### E5. scan\_deps.py and risk\_score.py

scan\_deps.py reads requirements.txt (and package.json, if present) and prints each dependency with file and line.

```python
import json, sys, pathlib
OPS = '<>=!~[;'

def parse_req(path):
    out = []
    for i, line in enumerate(pathlib.Path(path).read_text().splitlines(), 1):
        s = line.split('#')[0].strip()
        if not s:
            continue
        cuts = [s.find(c) for c in OPS if c in s]
        cut = min(cuts) if cuts else len(s)
        spec = s[cut:]
        out.append({'name': s[:cut].strip(), 'spec': spec, 'file': str(path), 'line': i,
                    'has_upper_bound': ('<' in spec) or ('==' in spec) or ('~=' in spec)})
    return out
```

Expected result on the target, to check your parser: anthropic and openai have no upper bound, while fastapi, uvicorn and PyYAML do.

risk\_score.py turns the scan into maintenance signals with evidence, and no CVE lookups:

| Signal | How to detect | Tag |
| --- | --- | --- |
| No upper version bound | From scan\_deps output | OBSERVED |
| Vendor-locked SDK | Small allow-list of vendor packages (anthropic, openai) | OBSERVED |
| Hardcoded model IDs | Search the code for the MODELS registry and model-name strings | OBSERVED |
| Stale or deprecated package | PyPI release date lookup | OBSERVED, or not\_run if offline |

If there is no network, record the PyPI check as not\_run with the reason instead of skipping it silently.

### E6. find\_usages.py and the footprint map

Use the ast module so that imports inside functions are found too (in the target, import anthropic appears inside \_run\_anthropic, which ast.walk will catch).

```python
import ast, json, pathlib, sys
SKIP = ('node_modules', '.venv', '.git', 'target')
ALIAS = {'PyYAML': 'yaml'}  # package name differs from import name

def find(repo, pkg):
    mod, out = ALIAS.get(pkg, pkg), []
    for p in pathlib.Path(repo).rglob('*.py'):
        if any(x in p.parts for x in SKIP):
            continue
        try:
            tree = ast.parse(p.read_text(encoding='utf-8'))
        except SyntaxError:
            continue
        for n in ast.walk(tree):
            names = []
            if isinstance(n, ast.Import):
                names = [a.name for a in n.names]
            elif isinstance(n, ast.ImportFrom) and n.module:
                names = [n.module]
            for name in names:
                if name.split('.')[0] == mod:
                    out.append({'package': pkg, 'file': str(p), 'line': n.lineno, 'import': name})
    return out
```

Footprint map: after finding the import alias, walk ast.Attribute and ast.Call nodes rooted at that alias (for example anthropic.Anthropic and client.messages.stream) and count distinct symbols and call sites. Exit difficulty can be a simple documented formula such as symbols plus call sites plus number of files. Whatever you choose, state the formula in the capsule so it is not presented as a measured fact.

### E7. run\_checks.py (baseline and after)

For each check record the command, exit code, duration, the tail of the output and a sha256 of the output. Candidate checks for the target:

- Install: pip install -r requirements.txt
- Compile: python -m compileall .
- Import check: python -c 'import agent'. Unverified: it may fail if skill\_ops or the database setup needs files under \~/.hermes, in which case record a failure or not\_run with the reason.
- Tests: pytest, only if test files exist. The target appears to have none, so record not\_run with the reason no tests found.
- Smoke test: start uvicorn server:app on a spare port and request /api/health (the README lists this endpoint). Unverified, so try it by hand first.

```python
import hashlib, os, subprocess, time

def _txt(x):
    return x.decode(errors='replace') if isinstance(x, bytes) else (x or '')

def run(argv, cwd, timeout=300, env=None):
    # argv is a list (no shell=True). env should hold only what the check needs, no secrets.
    t = time.time()
    try:
        p = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)
        out, code = p.stdout + p.stderr, p.returncode
        status = 'passed' if code == 0 else 'failed'
    except subprocess.TimeoutExpired as e:
        out, code, status = _txt(e.stdout) + _txt(e.stderr), None, 'timeout'
    except FileNotFoundError as e:
        out, code, status = str(e), None, 'not_run'
    return {'argv': argv, 'cwd': str(cwd), 'exit': code, 'status': status,
            'seconds': round(time.time() - t, 2), 'tail': out[-2000:],
            'sha256': hashlib.sha256(out.encode()).hexdigest()}
```

Safety basics (see Part I): install into a throwaway virtual environment inside work/, pass a minimal environment, use timeouts, and never run the target on a machine that holds secrets you care about.

Run it on the original checkout (baseline) and again on the worktree (after). The capsule shows both and the difference.

### E8. ai\_analyze.py (structured claims)

Call the model through the OpenAI-compatible client. The prompt must demand JSON only and use the usage snippets from usages.json as the only context.

````python
import os, json
from openai import OpenAI
client = OpenAI(base_url=os.environ['EXITKIT_BASE_URL'],
                api_key=os.environ.get('EXITKIT_API_KEY', 'x'), timeout=120)

def ask(system, user, retries=1):
    last = 'unknown'
    for _ in range(retries + 1):
        try:
            r = client.chat.completions.create(model=os.environ['EXITKIT_MODEL'],
                messages=[{'role': 'system', 'content': system}, {'role': 'user', 'content': user}])
            text = r.choices[0].message.content.strip()
            data = json.loads(text.removeprefix('```json').removesuffix('```').strip())
        except json.JSONDecodeError:
            last = 'invalid_json'
            continue
        except Exception as e:
            last = 'transport_error: ' + type(e).__name__
            continue
        if not isinstance(data, dict) or 'claims' not in data:
            last = 'schema_error'
            continue
        return {'ok': True, 'data': data}
    return {'ok': False, 'failure': last}
````

Three failure kinds are kept apart (transport, invalid JSON, wrong schema) and every one is recorded in the capsule as a limitation, never retried silently. A call without a timeout can hang the whole run, so the client sets one.

Ask for a plan (steps), a unified diff and a list of claims. Each claim has an id, a type, a one-sentence statement and params. Allowed claim types:

| Type | Example statement | Checked by |
| --- | --- | --- |
| only\_used\_in | The anthropic package is imported only in agent.py | AST usage scan |
| schema\_compat | The five tool schemas convert to the OpenAI function format unchanged | jsonschema validation |
| runtime\_behavior | The agent loop completes a tool call on the new route | Fake-server run (stretch goal) |
| other | Anything else | Always UNVERIFIABLE |

If the model returns invalid JSON twice, store the failure in the capsule as a limitation instead of hiding it. Everything this script produces is tagged AI-GENERATED.

### E9. verifiers.py (the Claim Ledger)

Each verifier returns a verdict (CONFIRMED, REFUTED or UNVERIFIABLE) and the evidence it used.

```python
def verify_only_used_in(claim, usages):
    pkg = claim['params']['package']
    found = sorted({u['file'] for u in usages if u['package'] == pkg})
    claimed = sorted(claim['params']['files'])
    return ('CONFIRMED' if found == claimed else 'REFUTED'), {'found_files': found}

VERIFIERS = {'only_used_in': verify_only_used_in}  # add schema_compat, runtime_behavior

def run_ledger(claims, usages):
    results = []
    for c in claims:
        fn = VERIFIERS.get(c['type'])
        verdict, ev = fn(c, usages) if fn else ('UNVERIFIABLE', {'reason': 'no verifier'})
        results.append({'claim_id': c['id'], 'verdict': verdict, 'evidence': ev})
    return results
```

schema\_compat: import the target's TOOLS list (agent.py defines five tools), convert each input\_schema to the OpenAI function format, and check it with jsonschema's Draft7Validator.check\_schema. If the import fails, return UNVERIFIABLE with the error as the reason.

runtime\_behavior (stretch goal): run a tiny local HTTP server that mimics the OpenAI chat completions endpoint and call the target's \_run\_openai against it. Caveat: \_run\_openai calls the API with stream=True, so the fake server must reply with server-sent-event chunks, not a single JSON body. If time is short, leave this claim type as UNVERIFIABLE.

Report the summary in the capsule, for example: 9 claims, 6 confirmed, 1 refuted, 2 unverifiable.

### E10. apply\_patch.py (worktree; proposed, applied, verified)

```python
from pathlib import Path
import subprocess

repo = Path('target-repo').resolve()     # absolute paths first, always
patch = Path('work/patch.diff').resolve()
wt = Path('exitkit-wt').resolve()

ALLOWED = {'agent.py', 'requirements.txt', '.env.example'}   # decide before generating the diff
MAX_FILES = 5

def changed_files(patch_text):
    return [l[6:] for l in patch_text.splitlines() if l.startswith('+++ b/')]

files = changed_files(patch.read_text())
if not files or len(files) > MAX_FILES or any(f not in ALLOWED for f in files):
    raise SystemExit('patch rejected: unexpected files ' + str(files))

run = lambda *a: subprocess.run(list(a), check=True)
run('git', '-C', str(repo), 'worktree', 'add', str(wt), '-b', 'exitkit/exit-anthropic')
root = subprocess.run(['git', '-C', str(wt), 'rev-parse', '--show-toplevel'],
                      capture_output=True, text=True, check=True).stdout.strip()
assert Path(root).resolve() == wt, 'worktree root mismatch'
run('git', '-C', str(wt), 'apply', '--check', str(patch))
run('git', '-C', str(wt), 'apply', str(patch))
```

The earlier version used relative paths, so git apply ran inside the worktree and looked for the patch in the wrong place. Resolving every path first, checking the worktree root and checking the patch's file list fixes that. Test this whole step on a small throwaway repo before using the target.

Track three separate statuses: proposed (the model suggested a diff), applied (git apply succeeded) and verified (after-checks ran and passed). If git apply --check fails, record the change as proposed only and keep the error text in the capsule. Never edit the original checkout.

### E11. build\_capsule.py (provenance enforcement)

The builder must refuse to mislabel AI output. Each entry names the script that produced it, and the builder checks that the source is allowed for the tag. Verdicts are accepted only from the ledger.

```python
RULES = {'OBSERVED': {'scan', 'usages', 'risk'}, 'EXECUTED': {'checks'}, 'AI-GENERATED': {'ai'}}

def add(entries, tag, source, text, evidence=None):
    if source not in RULES[tag]:
        raise ValueError(source + ' may not emit ' + tag)
    entries.append({'tag': tag, 'source': source, 'text': text, 'evidence': evidence or []})

def add_verdict(verdicts, claim_id, verdict, evidence, source):
    if source != 'ledger':
        raise ValueError('only the ledger may set a verdict')
    verdicts[claim_id] = {'verdict': verdict, 'evidence': evidence}
```

Then validate the assembled capsule with jsonschema against references/capsule-schema.json, and write two files: capsule.json (for tools) and capsule.md (for people, rendered from assets/capsule-template.md).

### E12. verify.py (re-runnable capsule)

The command python scripts/verify.py capsule.json reproduces the evidence, but it never runs commands taken from the capsule. The capsule stores check IDs (for example compile, import\_agent, smoke\_health), and verify.py maps each ID to a fixed command list inside its own code. To reproduce: check out the recorded base commit in a fresh temporary directory, confirm the stored patch matches its recorded sha256, apply it, run the allowed checks, and compare exit codes and normalized output hashes. Normalization removes timestamps, durations, absolute paths and terminal color codes, and the capsule states exactly which of these it removes. Treat everything in an imported capsule, commands included, as untrusted data.

### E13. Tests for the tool itself

- test\_scan.py: a fixture requirements.txt with known lines, checking name, spec, line and has\_upper\_bound.
- test\_provenance.py: confirm build\_capsule raises an error when an AI source tries to emit OBSERVED or EXECUTED, or when a non-ledger source sets a verdict.
- test\_schema.py: a good capsule validates, and a capsule missing a required field fails.
- test\_verifiers.py: a claim with a wrong file list returns REFUTED.

Run with pytest. These tests show engineering quality and catch mistakes in your own scripts.

## Part F: How to perform the build

### F1. One-time setup

1. Install Python 3.10+, Node.js, git and Ollama (or vLLM).
2. Pull a model with ollama pull \<model-name>, then confirm the endpoint answers: curl http://localhost:11434/v1/models.
3. Clone the target: git clone https://github.com/runninwithitmarketing/hermes-skill-deck target-repo.
4. Create your own repo exitkit/, run git init, and save this document's Part E as docs/BUILD.md so your coding tool can read it.
5. Start the coding tool inside your repo, for example npm install -g freebuff and then freebuff.

### F2. Build loop (repeat for every step)

Give the tool one step at a time, for example: Read docs/BUILD.md, section E5. Implement scripts/scan\_deps.py as described, plus tests/test\_scan.py. Run pytest and show me the result. Then do three things yourself: read the diff, run the script on target-repo, and commit.

### F3. Phases and done criteria

| Phase | What to build | Done when |
| --- | --- | --- |
| A | SKILL.md and the capsule schema | The folder follows the agentskills.io format |
| B | scan\_deps.py and find\_usages.py | On the target, anthropic and openai show no upper bound, and usages appear with file and line |
| C | run\_checks.py | A baseline file exists, with honest not\_run reasons |
| D | build\_capsule.py with provenance rules | A test proves an AI source cannot emit OBSERVED or EXECUTED |
| E | ai\_analyze.py | The local model returns valid JSON claims |
| F | verifiers.py | At least one claim is CONFIRMED or REFUTED by code |
| G | apply\_patch.py | The patch applies in a worktree and the after-checks run |
| H | Optional: the thin CLI, verify.py, the MERN dashboard | Only start after phases A to G work |

### F4. Final run

1. Run the whole pipeline on target-repo in the order listed in SKILL.md.
2. Keep the resulting capsule.json and capsule.md as the demo evidence.
3. Fix what fails, and record what you cannot fix in the capsule's limitations.
4. Rehearse the demo plan in section 11 of Part A.

### F5. Two rules while building

- Test every step before moving on. Tool-generated code often looks right and fails on the real repo.
- Do not hide failures. A refuted claim or a failed check, shown clearly, supports the pitch.

## Part G: Submission checklist and open items

### G1. Requirement-to-evidence checklist

See the table in section 9 of Part A for how each Track 2 requirement maps to an ExitKit feature. Before submitting, confirm each row has real evidence from a real run on the target repo.

### G2. Submission checklist

- [ ] SKILL.md validated against the current agentskills.io standard
- [ ] README with setup, model name, model license and hardware notes, and how to run
- [ ] A real capsule generated from the organizer's repo
- [ ] A demo video or a live demo script
- [ ] A clear statement of the original contribution: new skill, ledger, provenance enforcement and re-runnable capsule, not just a prompt or a UI
- [ ] Honest limitations written into the capsule and the README

### G3. Build checklist

- [ ] Schema and SKILL.md written
- [ ] scan\_deps and find\_usages match the expected results on the target
- [ ] run\_checks produces a baseline, including honest not\_run entries
- [ ] build\_capsule with provenance enforcement and schema validation, plus tests
- [ ] ai\_analyze returns valid claims from the local model
- [ ] only\_used\_in and schema\_compat verifiers
- [ ] apply\_patch in a worktree, with after-checks
- [ ] Footprint map and Exit Difficulty score
- [ ] verify.py
- [ ] Fake-server runtime check (stretch goal, cut first)
- [ ] Thin CLI and optional dashboard
- [ ] A real capsule from the real target saved as the demo artifact

### G4. Open items to settle

- Which open-weight model and runtime the team can actually run, and its license.
- Whether to build the optional MERN dashboard or a static capsule viewer.
- Contents of package.json, server.py and src-tauri in the target, which were not inspected during planning. Read them before finalizing the maintenance problem.
- Everything in Part E is untested sketch code and needs real testing on your machine.

## Part H: Agent Skills checklist, unique additions and the missing reasons

The brief says to follow agentskills.io, lists what to build, but gives no reasons and does not mention several things this project adds. This part fills both gaps. Source for the standard: [Agent Skills specification](https://agentskills.io/specification), read for this document. The reasons in H3 are my interpretation, since the brief does not state them.

### H1. What to follow from agentskills.io (checklist)

Each item says where ExitKit uses it and why the standard asks for it.

- [ ] **A skill is a directory with a SKILL.md file at its root.** Where: exitkit/SKILL.md. Why: it is the one required file, and agents find a skill through it.
- [ ] **name is 1 to 64 characters, lowercase letters, numbers and hyphens only, no leading or trailing hyphen, no double hyphens, and equal to the directory name.** Where: name: exitkit in the folder exitkit/. Why: the validator rejects anything else, and the name must match the folder.
- [ ] **description is non-empty, at most 1024 characters, and says both what the skill does and when to use it, with keywords.** Where: the SKILL.md frontmatter (the draft is in E3). Why: agents load only the name and description at startup (about 100 tokens) to decide whether to activate the skill, so a vague description means it never triggers.
- [ ] **Optional license field.** Where: license: MIT (our choice, change if needed). Why: states the terms for reuse, and the brief also asks teams to respect the model's license.
- [ ] **Optional compatibility field, at most 500 characters, only if there are real environment needs.** Where: Python 3.10+, git, and an OpenAI-compatible endpoint serving an open-weight model; add a network note if the PyPI check is used. Why: tells the agent whether it can run the skill here.
- [ ] **Optional metadata map (string keys and values).** Where: author and version. Why: lets tools store extra properties without breaking the standard.
- [ ] **allowed-tools is experimental, so skip it unless needed.** Why: support varies between agents, and it is not required.
- [ ] **Body has step-by-step instructions, input and output examples, and common edge cases.** Where: the Steps list in SKILL.md, plus a short example capsule and edge cases (no tests found, no network, model returns invalid JSON). Why: the agent reads the whole file when it activates the skill.
- [ ] **Keep SKILL.md under 500 lines and about 5000 tokens, and move detail into other files.** Where: long material goes to references/. Why: progressive disclosure keeps the agent's context small.
- [ ] **scripts/ are self-contained or document their dependencies, give helpful errors and handle edge cases.** Where: the scan, usage, check, AI, verifier, patch, capsule and verify scripts. Why: the agent runs them directly, so a silent failure breaks the whole task.
- [ ] **references/ holds focused, on-demand documents.** Where: capsule-schema.json and provenance-rules.md. Why: smaller files use less context.
- [ ] **assets/ holds templates and static data.** Where: capsule-template.md. Why: keeps output formatting out of the instructions.
- [ ] **File references use relative paths from the skill root, one level deep.** Where: links like references/provenance-rules.md in SKILL.md. Why: deep reference chains are hard for agents to follow.
- [ ] **Run skills-ref validate ./exitkit.** Where: once the folder exists, and again before submitting. Why: the reference library checks frontmatter and naming conventions, so mistakes show up before the judges see them.

The brief says an Agent Skill should follow the applicable requirements, so the items above that are marked optional are not required, but required items must pass.

### H2. What ExitKit adds that the brief does not mention

The brief does not ask for any of these. They are our choices, and they are what we present as the original contribution. The first three are the core.

| Addition | Where it lives | Why we add it |
| --- | --- | --- |
| Claim Ledger: code tries to refute each AI claim | scripts/verifiers.py, ai\_analysis in the capsule | The brief only asks to label AI output. Labels do not show which AI claims are right |
| Provenance enforced in code, not just headings | scripts/build\_capsule.py | It makes requirement 6 hard to break by accident |
| Re-runnable capsule with a verify command | scripts/verify.py | A judge can reproduce the evidence instead of trusting a document |
| Exit Footprint Map and Exit Difficulty score | scripts/find\_usages.py | Turns a claim like hard to remove into counts, with the formula stated |
| Worktree isolation with proposed, applied and verified statuses | scripts/apply\_patch.py | Keeps the original repo untouched and the change reviewable |
| not\_run entries with reasons | scripts/run\_checks.py | Makes limitations visible, which supports requirement 5 |
| Schema-validated JSON plus Markdown capsule | references/capsule-schema.json | Other tools or agents can read the capsule reliably |
| Optional thin CLI and dashboard | exitkit.py and the MERN layer (Part D) | Convenience only. They are not the contribution |

Note that the brief says using an existing agent, changing its prompt or changing its UI is not enough. The table above is why the contribution is the new workflow and checks, not a prompt or a UI.

### H3. Why each requirement exists (the brief gives no reasons)

These reasons are my interpretation. The brief states the requirements without explaining them.

| Requirement | Likely reason | How ExitKit meets it |
| --- | --- | --- |
| Open-source or open-weight AI | Keeps the solution reusable and not tied to one vendor | A local model through Ollama or vLLM |
| Follow the Agent Skills standard | Lets the skill run in any compatible agent | H1 checklist and skills-ref validation |
| Identify a specific maintenance problem | Prevents vague tools that analyse everything and fix nothing | Dependency exit, starting with the anthropic SDK path |
| Use the repo's real code and data | Prevents generic advice that ignores the project | AST usage scan and manifest parsing |
| Use AI meaningfully | Prevents wrapping a script in a chatbot | The model proposes the plan, the diff and checkable claims |
| Run tests or checks | Advice is not evidence until something is run | Baseline and after checks with exit codes |
| Identify errors and gaps | Honest tools report what they could not do | Refuted claims, failures, not\_run entries |
| Separate AI from verified | AI output can sound right and be wrong | Provenance tags plus the Claim Ledger |
| Produce a reusable capsule | Lets the next maintainer or agent continue without redoing work | Schema-validated capsule.json and capsule.md |
| Original contribution | Prevents submissions that only deploy an existing agent | H2 additions |

## Part I: Fixes from an independent architecture review

An outside review of this master document found real problems. This part records what was adopted and what was not, and E7, E8, E10 and E12 above were corrected to match. The review looked at the documents only: it did not run the code, so these are design fixes, not test results.

### I1. What was adopted

| Finding | Change made |
| --- | --- |
| The patch step used relative paths and would look for the patch in the wrong place | E10 rewritten with absolute paths, a worktree root check and an allowed-files check on the diff |
| Passing checks do not prove the dependency was exited | Exit invariants added (I3), and a migration is only called verified if they pass |
| A worktree protects the original checkout but does not stop target code from running | Practical safety basics added (I2), and the limit is stated in the capsule |
| verify.py could run arbitrary commands from a capsule | E12 now uses a fixed allow-list of check IDs |
| shell=True, no timeouts, API errors outside the retry block | E7 and E8 rewritten |
| The model saw only import snippets | Context bundle defined (I5) |
| Verdicts and provenance could be overstated | Verdict meaning and typed capsule entries defined (I6, I8) |

### I2. Execution safety at hackathon scale

A container sandbox is not required here. These basics are enough, and the limitation goes into the capsule:

- Run all checks as argument lists, never through a shell.
- Install the target's dependencies into a throwaway virtual environment under work/ (the folder is bin on Linux and Mac, Scripts on Windows).
- Pass a minimal environment to every check, with no API keys or tokens.
- Give every check a timeout, and record timeouts as their own status.
- Only run the pipeline on repositories you are willing to execute, such as the public demo target, and never on private code or on a machine holding secrets.
- Ask for confirmation before the install step, or require a --yes flag.

### I3. Exit invariants (the verifier step for the migration itself)

The Claim Ledger checks individual claims. These checks decide whether the exit actually happened. Define the acceptance goal before generating a diff, and record it in the capsule.

| Invariant | How it is checked | Kind |
| --- | --- | --- |
| anthropic is gone from requirements.txt | Re-run scan\_deps on the worktree | Hard |
| No import or from anthropic line remains | Re-run find\_usages on the worktree and expect no results | Hard |
| The replacement route is the one in use | Static check that the model registry resolves to the OpenAI-compatible client with a local base URL, plus a run if one is possible | Hard if testable, otherwise recorded as not verified |
| Lost capabilities are listed | Compare the model registry before and after (for example, Claude models no longer selectable) | Recorded, never hidden |
| Tool schemas convert to the OpenAI function format | schema\_compat verifier | Hard |
| After-checks are no worse than the baseline | Compare the two check runs | Hard |

Status rule: a change is verified only when every hard invariant passes. If some hard invariants pass and others could not run, it is partially verified. Otherwise it is failed or proposed only. A smaller dependency list alone is not a success, so pick the goal first: remove the SDK entirely, or add a local route and keep Claude. The first is cleaner for the exit story, the second preserves functionality. This is a team decision (see I10).

### I4. Fail-closed state machine

| State | Moves on only if | If it fails |
| --- | --- | --- |
| Intake | Git root, commit and manifests found | Stop with a capsule explaining why |
| Evidence | Scan and usage map complete, skipped files listed | Record gaps, continue with a limitation |
| Baseline | Checks ran or are recorded as not\_run with a reason | Continue, but flag the weaker evidence |
| Proposal | Model returned valid JSON and a diff | Record the failure kind (transport, JSON, schema) and stop |
| Patch gate | Claims checked, diff passes the allowed-files check, git apply --check passes | Status stays proposed |
| Applied | Patch applied in the worktree | Record the error, status stays proposed |
| After-checks | Checks and exit invariants ran | Status is failed or partially verified |
| Verified | All hard invariants pass | Not reached |

A failure at any state must never produce a success claim, and the pipeline must still write a capsule that says what happened and what is unverified. This also gives the demo honest failure paths, because a small local model will not always produce a valid patch.

### I5. Context bundle for the model

Import lines alone miss streaming, the tool-call loop, error handling and response formats. Give the model, as plain evidence, the full text of resolve\_model, \_run\_anthropic, \_run\_openai, TOOLS, MODELS and KEY\_ENV from agent.py, the dependency lines from requirements.txt and the baseline check results. Tell it to list missing information instead of guessing, and keep it to this bundle.

### I6. What a verdict means

- CONFIRMED: the specific predicate passed its defined check, and nothing more.
- REFUTED: evidence contradicts that predicate.
- UNVERIFIABLE: there is no verifier or not enough evidence.

A confirmed claim is never promoted into an overall migration verdict. Only the exit invariants and after-checks decide that. Also, every claim type listed in E8 must either have a working verifier or be labeled unsupported, and schema\_compat only shows that converted schemas are valid, not that behavior is compatible.

### I7. Honest wording for risk and difficulty

Keep three things apart: observed signals (what the scanner found), the risk ranking (a documented heuristic), and the Exit Difficulty score (a count-based estimate, not a failure probability). Do not label a dependency high risk because a made-up score crossed a threshold; show the evidence and the uncertainty. Scanners must also record the files they skipped and why, parse only the manifest formats they support, and say which formats are unsupported (the requirements parser in E5 does not cover continuations, editable installs or environment markers, and no lockfile scanning is implemented).

### I8. Capsule identity and provenance

A commit hash alone does not identify a patched worktree. Record the base commit, the exact patch text and its sha256, the Python and tool versions, the model name, the check IDs and exit codes, and the normalized output hashes. Build capsule entries from typed results returned by each script, not from free-text tags passed in by callers, and validate that evidence references point to real records.

### I9. Extra tests to write

- Patch with a path outside the allowed files is rejected.
- The patch applies in a fresh temporary repo using absolute paths.
- Exit invariants fail when an import is left behind.
- verify.py refuses a command that is not in its allow-list.
- Failure paths: malformed model JSON, a transport error, a rejected patch, a failed check and a repo with no tests all produce a capsule with the right status.

### I10. Priorities and open decisions

Moved into the must-have list: the safety basics in I2, patch validation, exit invariants and the fail-closed states. Still deferred: the MERN dashboard, an elaborate CLI, the fake-server streaming test, multi-language and lockfile coverage, and any fancier risk scoring.

Not adopted from the review: a full container sandbox (too heavy for the time available), so that is the only suggestion left out. The review's hardware statement was unconfirmed when it was written and has since been confirmed by the team (see I11). The review also pointed out that behavior-preservation tests are limited because the target seems to have no tests, so the exit invariants plus smoke checks carry most of the evidence.

Open decisions for the team: the migration goal (remove the SDK, or add a local route and keep Claude), the exact model and runtime, and whether the target's package.json, server.py and src-tauri hold anything that changes the plan.

### I11. Confirmed hardware and model plan

The team confirmed two machines. Both have 16 GB of RAM, and the GPU VRAM is what limits model choice.

| Machine | GPU | VRAM | RAM | CPU |
| --- | --- | --- | --- | --- |
| A | RTX 5050 Laptop GPU | 8 GB | 16 GB | Not stated |
| B | RTX 4050 Laptop GPU, plus Intel UHD Graphics (128 MB, not useful for models) | 6 GB | 16 GB | 13th Gen Intel Core i5-13420H, 2.10 GHz |

Size figures below come from public model pages and community guides, and the fit is an estimate. Verify it by running ollama ps after loading a model, which shows how much sits on the GPU and how much spilled to the CPU.

| Option | Size | Fit | Use |
| --- | --- | --- | --- |
| qwen2.5-coder:7b (4-bit) | About 4.7 GB | Fits machine A with room for context. On machine B it is tight, so keep the context small and expect some CPU spill | Primary choice |
| qwen2.5-coder:3b | Roughly 2 GB (approximate, check the library page) | Fits both machines | Fallback on machine B or for quick tests |
| 14B and larger | About 9 GB for a 14B | Does not fit either GPU, so it spills into slow system memory | Do not plan around it |

Practical rules:

- **Demo on machine A (8 GB)** and keep machine B as the development or backup machine.
- **Keep the model's context small.** Set num\_ctx to something like 4096 to 8192 in an Ollama Modelfile, since a large default context uses extra memory and slows consumer hardware. The context bundle in I5 should therefore be only the needed functions, not whole files.
- **Use plain JSON prompting, not tool calling.** Community reports describe qwen2.5-coder getting stuck in tool-call loops inside some agent tools. ExitKit's ask() function in E8 asks for plain JSON, so it avoids that path, and the failure handling in I4 covers malformed output.
- **Expect weak patches from a 7B model.** Community guidance calls 7B a demo tier that loses multi-file agent tasks. That matches the plan: one small, single-file migration with the allowed-files check, and honest failure paths in the demo.
- **Record the environment in the capsule:** model name and size, quantization, context length, machine and the time one call took.
- **License:** check the license on the exact model page before submitting, and cite it in the README.
