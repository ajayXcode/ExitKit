#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { readJSON, writeJSON, parseArgs } from '../src/util.js';
import { scanRepo, scoreRisk, findUsages, runChecks, analyze, runLedger, applyPatch, buildCapsule, verifyCapsule, runPipeline } from '../src/index.js';

const VERSION = readJSON(new URL('../package.json', import.meta.url)).version;
const HELP = `exitkit ${VERSION} - exit a risky dependency safely

Usage: exitkit <command> [options]

Commands:
  run <repo> [--package NAME]   full pipeline, writes capsule.json + capsule.md
  scan <repo>                   list dependencies (file:line, version bounds)
  risk <repo> [--online]        maintenance signals per dependency (no CVEs)
  usages <repo> <package>       usage locations + exit footprint
  checks <repo> [--name baseline|after] [--install] [--cmd "..."]
  analyze <repo> <package>      open-weight model: plan, diff, claims
  ledger <repo>                 verify AI claims with deterministic checks
  patch <repo> [--worktree DIR] apply the diff in a git worktree
  capsule <repo>                build and validate the capsule
  verify <capsule.json> [--repo DIR]  re-run recorded commands and compare

Options:
  --work DIR     working directory for intermediate files (default .exitkit)
  --out DIR      capsule output directory (default: work dir)
  --online       allow registry lookups for stale-package checks
  --install      run dependency install as part of the checks
  --cmd "..."    extra smoke command (repeatable)
  --model NAME   open-weight model name (or EXITKIT_MODEL env var)
  --api-base URL OpenAI-compatible API base URL (or EXITKIT_BASE_URL env var)
  --api-key KEY  API key if required (or EXITKIT_API_KEY env var)
  --json         print JSON instead of a summary

Model (any OpenAI-compatible endpoint serving an open-weight model):
  EXITKIT_BASE_URL, EXITKIT_MODEL, EXITKIT_API_KEY
`;

async function main() {
  const { _: pos, flags } = parseArgs(process.argv.slice(2));
  const [cmd, a, b] = pos;
  if (flags.version) return console.log(VERSION);
  if (!cmd || flags.help || cmd === 'help') return console.log(HELP);
  const work = path.resolve(flags.work || '.exitkit');
  const w = (n) => path.join(work, n);

  const need = (v, what) => {
    if (!v) throw new Error(`missing ${what}\n\n${HELP}`);
    const resolved = path.resolve(v);
    if (!fs.existsSync(resolved)) {
      throw new Error(`path for ${what} does not exist: "${resolved}"`);
    }
    return resolved;
  };

  const needGitRepo = (v, what = '<repo>') => {
    const repo = need(v, what);
    if (!fs.existsSync(path.join(repo, '.git'))) {
      throw new Error(`target ${what} is not a git repository (missing .git): "${repo}"`);
    }
    return repo;
  };

  const out = (data, summary) => console.log(flags.json ? JSON.stringify(data, null, 2) : summary);

  switch (cmd) {
    case 'run': {
      const repo = needGitRepo(a, '<repo>');
      const c = await runPipeline(repo, flags, (m) => console.error(m));
      const acc = c.ai_analysis.accuracy;
      out(c, [
        `\nCapsule written to ${path.resolve(flags.out || work)}/capsule.{json,md}`,
        `dependency: ${c.dependency.name} | exit difficulty: ${c.footprint.exit_difficulty} | change: ${c.proposed_changes.status}`,
        `claims: ${acc.total} (${acc.confirmed} confirmed, ${acc.refuted} refuted, ${acc.unverifiable} unverifiable)`,
        `checks: ${c.verification.passed.length} passed, ${c.verification.failed.length} failed, ${c.verification.not_run.length} not run`,
      ].join('\n'));
      break;
    }
    case 'scan': {
      const s = scanRepo(need(a, '<repo>')); writeJSON(w('deps.json'), s);
      out(s, s.dependencies.map((d) => `${d.name.padEnd(20)} ${(d.spec || '-').padEnd(12)} ${d.file}:${d.line}  ${d.has_upper_bound ? '' : 'NO UPPER BOUND'}`).join('\n'));
      break;
    }
    case 'risk': {
      const repo = need(a, '<repo>');
      if (!fs.existsSync(w('deps.json'))) throw new Error(`'deps.json' missing in "${work}": run 'exitkit scan <repo> --work ${work}' first`);
      const r = await scoreRisk(repo, readJSON(w('deps.json')), { online: !!flags.online }); writeJSON(w('risk.json'), r);
      out(r, [...r.dependencies.map((d) => `${String(d.score).padStart(2)}  ${d.name}\n${d.signals.map((s) => `      - ${s.text}`).join('\n')}`), ...r.not_run.map((n) => `not_run: ${n.id} - ${n.reason}`)].join('\n'));
      break;
    }
    case 'usages': {
      const repo = need(a, '<repo>');
      if (!b) throw new Error('missing <package>');
      const dep = fs.existsSync(w('deps.json')) ? readJSON(w('deps.json')).dependencies.find((d) => d.name.toLowerCase() === b.toLowerCase()) : null;
      const eco = flags.ecosystem || dep?.ecosystem || 'pypi';
      const u = findUsages(repo, dep?.name || b, eco); writeJSON(w('usages.json'), u);
      writeJSON(w('meta.json'), { repo, package: dep?.name || b, ecosystem: eco });
      out(u, [...u.usages.map((x) => `${x.file}:${x.line}  ${x.text}`), `symbols: ${u.footprint.symbols.join(', ') || 'none'}`, `call sites: ${u.footprint.call_sites}  files: ${u.footprint.files.length}  exit difficulty: ${u.footprint.exit_difficulty}`].join('\n'));
      break;
    }
    case 'checks': {
      const repo = need(a, '<repo>');
      const r = runChecks(repo, { install: !!flags.install, cmd: flags.cmd || [] });
      writeJSON(w(`${flags.name || 'baseline'}.json`), r);
      out(r, r.checks.map((c) => `${c.status.padEnd(8)} ${c.id}${c.reason ? ` - ${c.reason}` : ` (exit ${c.exit})`}`).join('\n'));
      break;
    }
    case 'analyze': {
      const repo = need(a, '<repo>');
      if (!b) throw new Error('missing <package>');
      if (!fs.existsSync(w('usages.json'))) throw new Error(`'usages.json' missing in "${work}": run 'exitkit usages <repo> <package> --work ${work}' first`);
      const ai = await analyze(repo, b, readJSON(w('usages.json')), flags); writeJSON(w('claims.json'), ai); fs.writeFileSync(w('patch.diff'), ai.diff || '');
      out(ai, `status: ${ai.status}${ai.reason ? ` - ${ai.reason}` : ''}\nclaims: ${ai.claims.length}  diff: ${ai.diff ? ai.diff.split('\n').length + ' lines' : 'none'}`);
      break;
    }
    case 'ledger': {
      const repo = need(a, '<repo>');
      if (!fs.existsSync(w('claims.json'))) throw new Error(`'claims.json' missing in "${work}": run 'exitkit analyze <repo> <package> --work ${work}' first`);
      if (!fs.existsSync(w('usages.json'))) throw new Error(`'usages.json' missing in "${work}": run 'exitkit usages <repo> <package> --work ${work}' first`);
      const l = runLedger(readJSON(w('claims.json')).claims, { repo, usages: readJSON(w('usages.json')) }); writeJSON(w('ledger.json'), l);
      out(l, [...l.claims.map((c) => `${c.verdict.padEnd(12)} ${c.id}: ${c.statement}`), `${l.summary.total} claims: ${l.summary.confirmed} confirmed, ${l.summary.refuted} refuted, ${l.summary.unverifiable} unverifiable`].join('\n'));
      break;
    }
    case 'patch': {
      const repo = need(a, '<repo>');
      if (!fs.existsSync(w('meta.json'))) throw new Error(`'meta.json' missing in "${work}": run 'exitkit usages <repo> <package> --work ${work}' first`);
      if (!fs.existsSync(w('patch.diff'))) throw new Error(`'patch.diff' missing in "${work}": run 'exitkit analyze <repo> <package> --work ${work}' first`);
      const meta = readJSON(w('meta.json'));
      const p = applyPatch(repo, w('patch.diff'), { pkg: meta.package, worktree: flags.worktree }); writeJSON(w('patch.json'), p);
      writeJSON(w('after.json'), p.status === 'applied' ? runChecks(p.worktree, { install: !!flags.install, cmd: flags.cmd || [] }) : { path: null, checks: [] });
      out(p, `change status: ${p.status}${p.error ? `\nerror: ${p.error}` : `\nworktree: ${p.worktree}`}`);
      break;
    }
    case 'capsule': {
      if (!fs.existsSync(w('meta.json'))) throw new Error(`'meta.json' missing in "${work}": run 'exitkit usages <repo> <package> --work ${work}' first`);
      if (!fs.existsSync(w('usages.json'))) throw new Error(`'usages.json' missing in "${work}": run 'exitkit usages <repo> <package> --work ${work}' first`);
      const c = buildCapsule(work, { out: path.resolve(flags.out || work) });
      out(c, `capsule written (schema valid), change status: ${c.proposed_changes.status}`);
      break;
    }
    case 'verify': {
      const r = verifyCapsule(need(a, '<capsule.json>'), { repo: flags.repo });
      out(r, [...r.results.map((x) => `${x.pass ? 'PASS' : 'FAIL'}  ${x.phase}:${x.id}  exit ${x.actual_exit} (recorded ${x.expected_exit})  output ${x.hash_match ? 'matches' : 'differs'}`), ...r.notes.map((n) => `note: ${n}`), r.ok ? 'VERIFIED: recorded results reproduced' : 'NOT VERIFIED'].join('\n'));
      process.exitCode = r.ok ? 0 : 1;
      break;
    }
    default:
      throw new Error(`unknown command "${cmd}"\n\n${HELP}`);
  }
}

main().catch((e) => { console.error(`exitkit: ${e.message}`); process.exit(2); });
