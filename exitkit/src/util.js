import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const SKIP_DIRS = new Set(['node_modules', '.venv', 'venv', '.git', 'target', 'dist', 'build', '__pycache__', '.exitkit', '.next']);

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const exists = (p) => fs.existsSync(p);

export function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

export const ALLOWED_BINARIES = new Set([
  'git', 'python', 'python3', 'python.exe', 'python3.exe',
  'npm', 'npm.cmd', 'npx', 'npx.cmd', 'node', 'node.exe',
  'pytest', 'pip', 'pip3', 'cargo',
]);

export function isSafeCommand(cmd) {
  if (typeof cmd !== 'string' || !cmd.trim()) return false;
  const trimmed = cmd.trim();
  // Reject newlines or null bytes
  if (/[\r\n\0]/.test(trimmed)) return false;
  // Reject dangerous shell chaining operators and redirects
  if (/[;&`]/.test(trimmed) || /\$\(/.test(trimmed) || /\|\|/.test(trimmed) || />>/.test(trimmed)) {
    return false;
  }
  // If it contains pipe |, verify it is only inside quotes (such as compileall -x "regex|regex")
  if (trimmed.includes('|')) {
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if ((ch === '"' || ch === "'") && (i === 0 || trimmed[i - 1] !== '\\')) {
        if (!inQuotes) { inQuotes = true; quoteChar = ch; }
        else if (quoteChar === ch) { inQuotes = false; }
      } else if (ch === '|' && !inQuotes) {
        return false;
      }
    }
  }
  // Extract binary executable name
  const firstToken = trimmed.split(/\s+/)[0].replace(/^["']|["']$/g, '');
  // Reject directory traversal attempts
  if (firstToken.includes('..')) return false;
  const binName = path.basename(firstToken).toLowerCase();
  return ALLOWED_BINARIES.has(binName);
}

export function validateCommand(cmd) {
  if (!isSafeCommand(cmd)) {
    throw new Error(`Command rejected by security validation: "${cmd}". Only standard approved dev tools (git, python, npm, etc.) without shell chaining are permitted.`);
  }
}

export function run(cmd, cwd, timeoutMs = 300000, extraEnv = {}) {
  validateCommand(cmd);
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
 
export function loadEnv(startDir = process.cwd()) {
  let here;
  try {
    here = fileURLToPath(import.meta.url);
  } catch {
    here = '';
  }
  const dirs = [startDir];
  try {
    dirs.push(path.resolve(startDir, '..'));
  } catch { /* ignore */ }
  if (here) {
    try {
      const pkgDir = path.resolve(path.dirname(here), '..');
      const rootDir = path.resolve(pkgDir, '..');
      dirs.push(pkgDir, rootDir);
    } catch { /* ignore */ }
  }
  const seen = new Set();
  for (const dir of dirs) {
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    for (const filename of ['.env.local', '.env']) {
      const p = path.join(dir, filename);
      if (!fs.existsSync(p)) continue;
      try {
        const content = fs.readFileSync(p, 'utf8');
        for (const rawLine of content.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const eqIdx = line.indexOf('=');
          if (eqIdx === -1) continue;
          const key = line.slice(0, eqIdx).trim();
          let val = line.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!(key in process.env)) {
            process.env[key] = val;
          }
        }
      } catch {
        // ignore unreadable files
      }
    }
  }
}
