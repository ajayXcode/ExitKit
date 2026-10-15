import fs from 'node:fs';
import path from 'node:path';
import { run, exists } from './util.js';

export function applyPatch(repo, diffFile, { pkg = 'dep', worktree } = {}) {
  const base = { tag: 'EXECUTED', source: 'patch', status: 'proposed', commands: [] };
  if (!diffFile || !exists(diffFile) || !fs.readFileSync(diffFile, 'utf8').trim()) return { ...base, error: 'no diff was proposed' };
  const absRepo = path.resolve(repo), diff = path.resolve(diffFile);
  if (run('git rev-parse --is-inside-work-tree', absRepo, 20000).exit !== 0) return { ...base, error: 'target is not a git repository; worktree isolation unavailable' };
  const wt = path.resolve(worktree || path.join(absRepo, '..', `${path.basename(absRepo)}-exitkit-wt`));
  const branch = `exitkit/exit-${pkg.replace(/[^\w.-]/g, '-')}`;
  const log = (r) => base.commands.push({ cmd: r.cmd, exit: r.exit });
  if (!exists(path.join(wt, '.git'))) {
    let r = run(`git worktree add "${wt}" -b ${branch}`, absRepo, 60000); log(r);
    if (r.exit !== 0) { r = run(`git worktree add "${wt}" ${branch}`, absRepo, 60000); log(r); }
    if (r.exit !== 0) return { ...base, error: `git worktree add failed: ${r.out.trim()}` };
  }
  const chk = run(`git apply --check "${diff}"`, wt, 60000); log(chk);
  if (chk.exit !== 0) return { ...base, worktree: wt, branch, error: `git apply --check failed: ${chk.out.trim()}` };
  const ap = run(`git apply "${diff}"`, wt, 60000); log(ap);
  if (ap.exit !== 0) return { ...base, worktree: wt, branch, error: `git apply failed: ${ap.out.trim()}` };
  return { ...base, status: 'applied', worktree: wt, branch };
}
