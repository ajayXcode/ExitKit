import fs from 'node:fs';
import path from 'node:path';
import { run, exists } from './util.js';

export function changedFiles(patchText) {
  const files = [];
  for (const line of String(patchText || '').split('\n')) {
    if (line.startsWith('+++ b/')) {
      const cleanPath = line.slice(6).trim();
      if (cleanPath && !files.includes(cleanPath)) {
        files.push(cleanPath);
      }
    }
  }
  return files;
}

export function validatePatchScope(diffText, { maxFiles = 10, allowedFiles } = {}) {
  const files = changedFiles(diffText);
  if (!files.length) {
    return { valid: false, error: 'diff contains no file modifications' };
  }
  if (files.length > maxFiles) {
    return { valid: false, error: `patch scope exceeded: modifies ${files.length} files (maximum ${maxFiles})`, files };
  }
  for (const f of files) {
    if (path.isAbsolute(f) || f.includes('..') || f.startsWith('/') || f.startsWith('\\')) {
      return { valid: false, error: `patch security rejection: path escapes repository root: "${f}"`, files };
    }
    if (allowedFiles && !allowedFiles.has(f)) {
      return { valid: false, error: `patch scope rejection: file "${f}" is outside allowed patch scope`, files };
    }
  }
  return { valid: true, files };
}

export function applyPatch(repo, diffFile, { pkg = 'dep', worktree, maxFiles = 10, allowedFiles } = {}) {
  const base = { tag: 'EXECUTED', source: 'patch', status: 'proposed', commands: [] };
  if (!diffFile || !exists(diffFile)) return { ...base, error: 'no diff was proposed' };
  const diffContent = fs.readFileSync(diffFile, 'utf8').trim();
  if (!diffContent) return { ...base, error: 'diff file is empty' };

  // Validate patch scope and prevent directory traversal
  const scope = validatePatchScope(diffContent, { maxFiles, allowedFiles });
  if (!scope.valid) {
    return { ...base, error: scope.error, files: scope.files || [] };
  }

  const absRepo = path.resolve(repo), diff = path.resolve(diffFile);
  if (run('git rev-parse --is-inside-work-tree', absRepo, 20000).exit !== 0) {
    return { ...base, error: 'target is not a git repository; worktree isolation unavailable' };
  }

  const wt = path.resolve(worktree || path.join(absRepo, '..', `${path.basename(absRepo)}-exitkit-wt`));
  const branch = `exitkit/exit-${pkg.replace(/[^\w.-]/g, '-')}`;
  const log = (r) => base.commands.push({ cmd: r.cmd, exit: r.exit });

  if (!exists(path.join(wt, '.git'))) {
    let r = run(`git worktree add "${wt}" -b ${branch}`, absRepo, 60000); log(r);
    if (r.exit !== 0) { r = run(`git worktree add "${wt}" ${branch}`, absRepo, 60000); log(r); }
    if (r.exit !== 0) return { ...base, error: `git worktree add failed: ${r.out.trim()}` };
  }

  const chk = run(`git apply --check "${diff}"`, wt, 60000); log(chk);
  if (chk.exit !== 0) return { ...base, worktree: wt, branch, files: scope.files, error: `git apply --check failed: ${chk.out.trim()}` };

  const ap = run(`git apply "${diff}"`, wt, 60000); log(ap);
  if (ap.exit !== 0) return { ...base, worktree: wt, branch, files: scope.files, error: `git apply failed: ${ap.out.trim()}` };

  return { ...base, status: 'applied', worktree: wt, branch, files: scope.files };
}
