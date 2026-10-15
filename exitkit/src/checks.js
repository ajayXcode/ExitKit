import os from 'node:os';
import path from 'node:path';
import { run, sha256, normalize, exists, walk, pythonBin, readJSON } from './util.js';

function hasPyTests(repo) {
  for (const f of walk(repo, ['.py'])) { const b = path.basename(f); if (b.startsWith('test_') || b.endsWith('_test.py')) return true; }
  return false;
}

export function planChecks(repo, opts = {}) {
  const py = pythonBin() || 'python3';
  const has = (f) => exists(path.join(repo, f));
  const plan = [];
  const isPy = has('requirements.txt') || has('pyproject.toml');
  if (isPy) {
    plan.push(opts.install ? { id: 'install', cmd: `${py} -m pip install -q -r requirements.txt` } : { id: 'install', skip: 'dependency install skipped (pass --install to run it)' });
    plan.push({ id: 'compile', cmd: `${py} -m compileall -q -x "(node_modules|\\.venv|\\.git|target|\\.exitkit)" .` });
    plan.push(hasPyTests(repo) ? { id: 'tests', cmd: `${py} -m pytest -q` } : { id: 'tests', skip: 'no tests found' });
  }
  if (has('package.json')) {
    let test = null;
    try { test = readJSON(path.join(repo, 'package.json')).scripts?.test; } catch { /* ignore */ }
    plan.push(test && !/no test specified/.test(test) ? { id: 'node-tests', cmd: 'npm test --silent' } : { id: 'node-tests', skip: 'no test script in package.json' });
  }
  (opts.cmd || []).forEach((c, i) => plan.push({ id: `custom-${i + 1}`, cmd: c }));
  if (!plan.length) plan.push({ id: 'detect', skip: 'no supported project type detected (looked for requirements.txt, pyproject.toml, package.json)' });
  return plan;
}

export function runChecks(repo, opts = {}) {
  const abs = path.resolve(repo);
  const checks = planChecks(abs, opts).map((c) => {
    if (c.skip) return { tag: 'OBSERVED', source: 'checks', id: c.id, status: 'not_run', reason: c.skip };
    const r = run(c.cmd, abs);
    return {
      tag: 'EXECUTED', source: 'checks', id: c.id, cmd: c.cmd, cwd: '.', status: r.exit === 0 ? 'passed' : 'failed',
      exit: r.exit, seconds: r.seconds, tail: r.out.slice(-1500), sha256: sha256(r.out), normalized_sha256: sha256(normalize(r.out, abs)),
    };
  });
  return { path: abs, checks };
}
