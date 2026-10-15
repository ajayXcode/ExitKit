import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJSON, writeJSON, exists, run } from './util.js';
import { add } from './provenance.js';
import { validate } from './schema.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = path.join(here, '..', 'references', 'capsule-schema.json');
const VERSION = readJSON(path.join(here, '..', 'package.json')).version;
export const COMPARISON_METHOD = 'exit code and sha256 of output after stripping timestamps, durations and the checkout path';

function repoInfo(repoPath) {
  const git = (c) => run(c, repoPath, 20000);
  const head = git('git rev-parse HEAD');
  const status = git('git status --porcelain');
  const dirtyLines = status.exit === 0 ? status.out.split('\n').filter((l) => l.trim() && !l.includes('.exitkit') && !l.includes('__pycache__')) : [];
  return { name: path.basename(repoPath), path: repoPath, commit: head.exit === 0 ? head.out.trim() : 'unknown', dirty: dirtyLines.length > 0 };
}

function checkEntries(checks) {
  const entries = [];
  for (const c of checks) {
    const { tag, source, id, status, ...rest } = c;
    const evidence = tag === 'EXECUTED' ? [{ cmd: c.cmd, exit: c.exit }] : [];
    add(entries, { tag, source, text: `${id}: ${status}${c.reason ? ` (${c.reason})` : ''}`, evidence, id, status, ...rest });
  }
  return entries;
}

export function buildCapsule(work, { out = work } = {}) {
  const rd = (n) => (exists(path.join(work, n)) ? readJSON(path.join(work, n)) : null);
  const meta = rd('meta.json');
  if (!meta) throw new Error('meta.json missing: run `exitkit usages` (or `exitkit run`) first');
  const risk = rd('risk.json'), usages = rd('usages.json'), baseline = rd('baseline.json'), ai = rd('claims.json'), ledger = rd('ledger.json'), patch = rd('patch.json'), after = rd('after.json');
  if (!usages) throw new Error('usages.json missing');

  const dep = risk?.dependencies.find((d) => d.name === meta.package) || { signals: [], spec: '' };
  const gaps = [], unresolved = [];
  const gap = (text) => add(gaps, { tag: 'OBSERVED', source: 'capsule', text });
  const open = (text) => add(unresolved, { tag: 'OBSERVED', source: 'capsule', text });

  const risk_indicators = [];
  for (const s of dep.signals) add(risk_indicators, { tag: 'OBSERVED', source: 'risk', text: s.text, evidence: s.evidence, id: s.id });
  for (const n of risk?.not_run || []) gap(`risk check not run: ${n.id} - ${n.reason}`);

  const usage_locations = [];
  for (const u of usages.usages) add(usage_locations, { tag: 'OBSERVED', source: 'usages', text: u.text, evidence: [{ file: u.file, line: u.line }], file: u.file, line: u.line });

  const maintenance_problem = { tag: 'OBSERVED', source: 'capsule', text: `Exit the dependency "${meta.package}": ${dep.signals.length ? dep.signals.map((s) => s.text).join('; ') : 'no maintenance signals were detected, exit requested by the user'}.` };

  // AI analysis: claims stay AI-GENERATED; verdicts come from the ledger only.
  const claims = [];
  const ledgerById = new Map((ledger?.claims || []).map((c) => [c.id, c]));
  for (const c of ai?.claims || []) {
    const l = ledgerById.get(c.id);
    if (!l) throw new Error(`claim ${c.id} has no ledger verdict: run \`exitkit ledger\` before \`exitkit capsule\``);
    add(claims, { tag: 'AI-GENERATED', source: 'ai', text: c.statement, evidence: [l.evidence], verdict: l.verdict, verdictSource: l.verdict_source, id: c.id, type: c.type, params: c.params });
  }
  const acc = ledger?.summary || { total: 0, confirmed: 0, refuted: 0, unverifiable: 0 };
  const ai_analysis = { tag: 'AI-GENERATED', source: 'ai', status: ai?.status || 'not_run', model: ai?.model || null, reason: ai?.reason || null, plan: ai?.plan || [], claims, accuracy: acc };
  if (ai_analysis.status !== 'ok') open(`AI analysis ${ai_analysis.status}: ${ai_analysis.reason || 'no result'}`);
  for (const c of claims.filter((x) => x.verdict === 'REFUTED')) open(`Refuted AI claim ${c.id}: ${c.text}`);
  if (acc.unverifiable) open(`${acc.unverifiable} AI claim(s) could not be verified automatically`);
  if (ai?.dropped_claims) open(`${ai.dropped_claims} malformed claim(s) from the model were discarded`);

  // Verification.
  const baseEntries = checkEntries(baseline?.checks || []);
  const afterEntries = checkEntries(after?.checks || []);
  const status = (list, id) => list.find((c) => c.id === id)?.status || 'absent';
  const comparison = baseEntries.map((b) => ({ id: b.id, baseline: b.status, after: status(afterEntries, b.id), regression: b.status === 'passed' && status(afterEntries, b.id) === 'failed' }));
  const all = [...baseEntries.map((c) => ({ ...c, phase: 'baseline' })), ...afterEntries.map((c) => ({ ...c, phase: 'after' }))];
  const verification = {
    baseline: baseEntries, after: afterEntries,
    passed: all.filter((c) => c.status === 'passed').map((c) => `${c.phase}:${c.id}`),
    failed: all.filter((c) => c.status === 'failed').map((c) => `${c.phase}:${c.id}`),
    not_run: all.filter((c) => c.status === 'not_run').map((c) => ({ id: `${c.phase}:${c.id}`, reason: c.reason })),
    comparison, comparison_method: COMPARISON_METHOD,
  };
  for (const n of verification.not_run) gap(`check not run: ${n.id} - ${n.reason}`);
  for (const f of verification.failed) gap(`check failed: ${f}`);
  if (!baseEntries.some((c) => c.id === 'tests' || c.id === 'node-tests') || baseEntries.some((c) => (c.id === 'tests' || c.id === 'node-tests') && c.status === 'not_run')) gap('no test suite ran, so behaviour preservation is not demonstrated by tests');

  // Proposed changes: proposed -> applied -> verified.
  let changeStatus = 'proposed';
  const hasDiff = typeof ai?.diff === 'string' && ai.diff.trim().length > 0;
  const invariants = rd('invariants.json');
  if (patch?.status === 'applied' && !patch?.error && hasDiff) {
    changeStatus = 'applied';
    const executedAfter = afterEntries.filter((c) => c.tag === 'EXECUTED');
    const passedAfter = executedAfter.filter((c) => c.status === 'passed');
    const failedAfter = executedAfter.filter((c) => c.status === 'failed');
    const noRegression = !comparison.some((c) => c.regression);
    const invariantsPassed = invariants ? invariants.ok : true;

    // Patch is only 'verified' if executed after-checks ran, at least one passed, none failed, no regression, and exit invariants passed
    if (passedAfter.length > 0 && failedAfter.length === 0 && noRegression && invariantsPassed) {
      changeStatus = 'verified';
    }
  }
  if (patch?.error) open(`patch not applied: ${patch.error}`);
  if (patch?.status === 'applied' && changeStatus !== 'verified') {
    if (invariants && !invariants.ok) {
      for (const inv of invariants.invariants.filter((i) => !i.pass)) {
        open(`Exit invariant failed: ${inv.statement} (${inv.details})`);
      }
    } else {
      open('patch applied but after-checks did not all pass; do not treat as verified');
    }
  }
  if (!patch) open('no patch step was run');
  const proposed_changes = { diff_tag: 'AI-GENERATED', status: changeStatus, diff: ai?.diff || '', branch: patch?.branch || null, worktree: patch?.worktree || null, error: patch?.error || null, apply_commands: patch?.commands || [] };

  const repository = repoInfo(meta.repo);
  if (repository.dirty) gap('the analysed checkout had uncommitted changes; the recorded commit does not fully describe it');
  for (const l of usages.limitations || []) gap(l);

  const capsule = {
    schema_version: '1.0', generated_at: new Date().toISOString(), tool: { name: 'exitkit', version: VERSION }, repository,
    dependency: { name: meta.package, ecosystem: meta.ecosystem, spec: dep.spec || '', manifest: dep.file ? `${dep.file}:${dep.line}` : null },
    maintenance_problem, risk_indicators, usage_locations, footprint: usages.footprint, ai_analysis, proposed_changes, verification, gaps, unresolved,
    out_of_scope: 'Security vulnerabilities were deliberately out of scope: no CVE or advisory data was used.',
  };
  const errs = validate(readJSON(SCHEMA_PATH), capsule);
  if (errs.length) throw new Error(`capsule failed schema validation:\n${errs.join('\n')}`);

  fs.mkdirSync(out, { recursive: true });
  writeJSON(path.join(out, 'capsule.json'), capsule);
  fs.writeFileSync(path.join(out, 'capsule.md'), renderMarkdown(capsule));
  return capsule;
}

const loc = (e) => (e.evidence?.[0]?.file ? ` (${e.evidence[0].file}:${e.evidence[0].line})` : '');

export function renderMarkdown(c) {
  const L = [];
  L.push(`# Dependency Exit Capsule: ${c.dependency.name}`, '');
  L.push(`Repository: \`${c.repository.name}\` at commit \`${c.repository.commit}\`${c.repository.dirty ? ' (dirty checkout)' : ''}  `);
  L.push(`Generated by exitkit ${c.tool.version} on ${c.generated_at} | schema ${c.schema_version}`, '');
  L.push('Tags: **OBSERVED** read from files, **EXECUTED** a command ran (command and exit code recorded), **AI-GENERATED** model output, unverified unless a verdict is shown.', '');
  L.push('## Maintenance problem', '', `[${c.maintenance_problem.tag}] ${c.maintenance_problem.text}`, '');
  L.push('## Risk indicators', '', ...(c.risk_indicators.length ? c.risk_indicators.map((r) => `- [${r.tag}] ${r.text}${loc(r)}`) : ['- none detected']), '');
  L.push('## Usage locations and footprint', '', ...c.usage_locations.map((u) => `- \`${u.file}:${u.line}\` ${u.text}`), '');
  L.push(`Symbols: ${c.footprint.symbols.join(', ') || 'none'} | call sites: ${c.footprint.call_sites} | files: ${c.footprint.files.length} | **exit difficulty ${c.footprint.exit_difficulty}**`, `Formula: ${c.footprint.formula}`, '');
  const a = c.ai_analysis;
  L.push('## AI analysis (AI-GENERATED) and Claim Ledger', '', `Model: ${a.model || 'n/a'} | status: ${a.status}${a.reason ? ` (${a.reason})` : ''}`, '');
  L.push(`Claim accuracy: ${a.accuracy.total} claims: ${a.accuracy.confirmed} confirmed, ${a.accuracy.refuted} refuted, ${a.accuracy.unverifiable} unverifiable`, '');
  if (a.plan.length) L.push('Plan proposed by the model:', ...a.plan.map((p, i) => `${i + 1}. ${p}`), '');
  if (a.claims.length) L.push('| Claim | Verdict | Evidence |', '| --- | --- | --- |', ...a.claims.map((x) => `| ${x.id}: ${x.text.replace(/\|/g, '/')} | **${x.verdict}** | ${JSON.stringify(x.evidence[0] || {}).replace(/\|/g, '/')} |`), '');
  L.push(`## Proposed change (status: ${c.proposed_changes.status})`, '', 'Statuses: proposed (model suggested a diff), applied (git apply succeeded in a worktree), verified (after-checks ran, none failed or regressed).', '');
  L.push(c.proposed_changes.diff ? '```diff\n' + c.proposed_changes.diff.trimEnd() + '\n```' : '_No diff was proposed._', '');
  const v = c.verification;
  L.push('## Verification (EXECUTED)', '', `Comparison method: ${v.comparison_method}`, '', '| Check | Baseline | After | Regression |', '| --- | --- | --- | --- |', ...v.comparison.map((x) => `| ${x.id} | ${x.baseline} | ${x.after} | ${x.regression ? 'YES' : 'no'} |`), '');
  L.push('Commands:', ...[...v.baseline, ...v.after].filter((x) => x.cmd).map((x) => `- \`${x.cmd}\` exit ${x.exit}`), '');
  if (v.not_run.length) L.push('Not run:', ...v.not_run.map((n) => `- ${n.id}: ${n.reason}`), '');
  L.push('## Compatibility and maintenance gaps', '', ...(c.gaps.length ? c.gaps.map((g) => `- ${g.text}`) : ['- none recorded']), '');
  L.push('## Unresolved concerns and limitations', '', ...(c.unresolved.length ? c.unresolved.map((g) => `- ${g.text}`) : ['- none recorded']), '', `_${c.out_of_scope}_`, '');
  return L.join('\n');
}
