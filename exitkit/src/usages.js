import fs from 'node:fs';
import { walk, rel } from './util.js';

const PY_IMPORT_NAME = { pyyaml: 'yaml', 'python-dotenv': 'dotenv', pillow: 'PIL', 'scikit-learn': 'sklearn', beautifulsoup4: 'bs4', 'opencv-python': 'cv2' };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const moduleName = (pkg, eco) => (eco === 'npm' ? pkg : (PY_IMPORT_NAME[pkg.toLowerCase()] || pkg.replace(/-/g, '_')));

function pyScan(lines, mod) {
  const hits = [], aliases = new Set(), names = new Map();
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith('#')) return;
    let m;
    if ((m = l.match(/^import\s+(.+)$/))) {
      for (const part of m[1].split(',')) {
        const mm = part.trim().match(/^([\w.]+)(?:\s+as\s+(\w+))?$/);
        if (mm && mm[1].split('.')[0] === mod) { hits.push({ line: i + 1, text: l }); aliases.add(mm[2] || mm[1].split('.')[0]); }
      }
    } else if ((m = l.match(/^from\s+([\w.]+)\s+import\s+(.+)$/)) && m[1].split('.')[0] === mod) {
      hits.push({ line: i + 1, text: l });
      for (const part of m[2].replace(/[()]/g, '').split(',')) {
        const mm = part.trim().match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (mm) names.set(mm[2] || mm[1], `${m[1]}.${mm[1]}`);
      }
    }
  });
  return { hits, aliases, names };
}

function jsScan(lines, pkg) {
  const hits = [], aliases = new Set(), names = new Map();
  const q = new RegExp(`['"]${esc(pkg)}(?:/[^'"]*)?['"]`);
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith('//') || l.startsWith('*')) return;
    let m;
    if (q.test(l) && /(\bimport\b|\brequire\s*\(|\bfrom\b)/.test(l)) {
      hits.push({ line: i + 1, text: l });
      if ((m = l.match(/import\s+(\w+)\s*(?:,|from)/))) aliases.add(m[1]);
      if ((m = l.match(/import\s+\*\s+as\s+(\w+)/))) aliases.add(m[1]);
      if ((m = l.match(/(?:const|let|var)\s+(\w+)\s*=\s*require/))) aliases.add(m[1]);
      if ((m = l.match(/\{([^}]*)\}/))) {
        for (const part of m[1].split(',')) {
          const mm = part.trim().match(/^(\w+)(?:\s+(?:as|:)\s+(\w+))?$/);
          if (mm) names.set(mm[2] || mm[1], `${pkg}.${mm[1]}`);
        }
      }
    }
  });
  return { hits, aliases, names };
}

export const FORMULA = 'exit_difficulty = distinct_symbols + call_sites + files_touched (simple documented heuristic, not a measured fact)';

export function findUsages(repo, pkg, ecosystem = 'pypi') {
  const mod = moduleName(pkg, ecosystem);
  const exts = ecosystem === 'npm' ? ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'] : ['.py'];
  const usages = [], symbols = new Set(), files = new Set();
  let callSites = 0;
  for (const f of walk(repo, exts)) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const { hits, aliases, names } = ecosystem === 'npm' ? jsScan(lines, pkg) : pyScan(lines, mod);
    if (!hits.length) continue;
    files.add(rel(repo, f));
    const hitLines = new Set(hits.map((h) => h.line));
    for (const h of hits) usages.push({ tag: 'OBSERVED', source: 'usages', package: pkg, file: rel(repo, f), line: h.line, text: h.text });
    lines.forEach((l, i) => {
      if (hitLines.has(i + 1) || /^\s*(#|\/\/)/.test(l)) return;
      for (const a of aliases) {
        for (const m of l.matchAll(new RegExp(`\\b${esc(a)}\\.([A-Za-z_]\\w*)`, 'g'))) { symbols.add(`${mod}.${m[1]}`); callSites++; }
      }
      for (const [local, full] of names) {
        for (const _m of l.matchAll(new RegExp(`\\b${esc(local)}\\b`, 'g'))) { symbols.add(full); callSites++; }
      }
    });
    for (const [, full] of names) symbols.add(full);
  }
  const footprint = {
    tag: 'OBSERVED', source: 'usages', symbols: [...symbols].sort(), call_sites: callSites, files: [...files].sort(),
    exit_difficulty: symbols.size + callSites + files.size, formula: FORMULA,
  };
  return {
    tag: 'OBSERVED', source: 'usages', package: pkg, module: mod, usages, footprint,
    limitations: ['Line-based pattern matching, not a full AST: multi-line imports, dynamic imports and instance-method calls (client.x.y) are not followed.'],
  };
}
