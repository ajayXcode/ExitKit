import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJSON, run, sha256, normalize, validateCommand } from './util.js';

export function verifyCapsule(capsulePath, { repo } = {}) {
  const c = readJSON(capsulePath);
  const source = path.resolve(repo || c.repository.path);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exitkit-verify-'));
  const co = path.join(tmp, 'checkout');
  const results = [], notes = [];
  if (c.repository.dirty) notes.push('capsule was made from a dirty checkout; results may differ from the recorded commit');

  // Validate commit identifier format to prevent argument injection
  const commit = String(c.repository.commit || '').trim();
  if (!/^[a-f0-9]{7,40}$/i.test(commit) && commit !== 'unknown') {
    throw new Error(`Untrusted or invalid repository commit hash in capsule: "${commit}"`);
  }

  let r = run(`git clone -q "${source}" "${co}"`, tmp, 120000);
  if (r.exit !== 0) throw new Error(`cannot clone ${source}: ${r.out.trim()}`);
  if (commit !== 'unknown') {
    r = run(`git checkout -q ${commit}`, co, 60000);
    if (r.exit !== 0) throw new Error(`cannot check out ${commit}: ${r.out.trim()}`);
  }

  const replay = (phase, list) => {
    for (const chk of (list || []).filter((x) => x.tag === 'EXECUTED')) {
      try {
        validateCommand(chk.cmd);
      } catch (err) {
        notes.push(`Command rejected for security reasons (${chk.cmd}): ${err.message}`);
        results.push({ phase, id: chk.id, cmd: chk.cmd, expected_exit: chk.exit, actual_exit: 126, hash_match: false, pass: false });
        continue;
      }
      const out = run(chk.cmd, co);
      const norm = sha256(normalize(out.out, co));
      const exitMatch = out.exit === chk.exit, hashMatch = norm === chk.normalized_sha256;
      results.push({ phase, id: chk.id, cmd: chk.cmd, expected_exit: chk.exit, actual_exit: out.exit, hash_match: hashMatch, pass: exitMatch && hashMatch });
    }
  };
  replay('baseline', c.verification.baseline);
  const pc = c.proposed_changes;
  if ((pc.status === 'applied' || pc.status === 'verified') && pc.diff) {
    const f = path.join(tmp, 'patch.diff');
    fs.writeFileSync(f, pc.diff.endsWith('\n') ? pc.diff : pc.diff + '\n');
    const ap = run(`git apply "${f}"`, co, 60000);
    if (ap.exit !== 0) { notes.push(`recorded diff no longer applies: ${ap.out.trim()}`); results.push({ phase: 'after', id: 'apply', cmd: 'git apply', expected_exit: 0, actual_exit: ap.exit, hash_match: false, pass: false }); }
    else replay('after', c.verification.after);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: results.length > 0 && results.every((x) => x.pass), results, notes, comparison_method: c.verification.comparison_method };
}
