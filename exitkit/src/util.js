import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import os from 'node:os';

export const SKIP_DIRS = new Set(['node_modules', '.venv', 'venv', '.git', 'target', 'dist', 'build', '__pycache__', '.exitkit', '.next']);

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const exists = (p) => fs.existsSync(p);

export function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

export function run(cmd, cwd, timeoutMs = 300000, extraEnv = {}) {
  const t = Date.now();
  const pycache = path.join(os.tmpdir(), 'exitkit-pycache');
  const env = { ...process.env, PYTHONPYCACHEPREFIX: pycache, ...extraEnv };
  const p = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, env });
  const out = (p.stdout || '') + (p.stderr || '');
  const timedOut = !!(p.error && p.error.code === 'ETIMEDOUT');
  return { cmd, exit: timedOut ? 124 : (p.status ?? 1), seconds: Math.round((Date.now() - t) / 10) / 100, out, timedOut };
}

// Remove volatile parts so two runs of the same command can be compared.
export function normalize(out, cwd) {
  let s = out;
  if (cwd) s = s.split(cwd).join('<CWD>');
  s = s.replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g, '<TS>');
  s = s.replace(/\b\d+(\.\d+)?\s?(ms|s|sec|secs|seconds|minutes?)\b/gi, '<DUR>');
  return s.split('\n').map((l) => l.trimEnd()).join('\n').trim();
}

export function* walk(dir, exts) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full, exts);
    else if (!exts || exts.includes(path.extname(e.name))) yield full;
  }
}

export function pythonBin() {
  for (const b of ['python3', 'python']) {
    if (run(`${b} --version`, process.cwd(), 10000).exit === 0) return b;
  }
  return null;
}

const BOOLEAN = new Set(['install', 'online', 'json', 'offline', 'help', 'version']);
const REPEATABLE = new Set(['cmd']);

export function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (BOOLEAN.has(key)) { args.flags[key] = true; continue; }
      const val = argv[++i];
      if (val === undefined) throw new Error(`--${key} needs a value`);
      if (REPEATABLE.has(key)) (args.flags[key] ||= []).push(val); else args.flags[key] = val;
    } else args._.push(a);
  }
  return args;
}

export const rel = (repo, f) => path.relative(repo, f).split(path.sep).join('/');
