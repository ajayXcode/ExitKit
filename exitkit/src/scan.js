import fs from 'node:fs';
import path from 'node:path';
import { exists } from './util.js';

const REQ_OPS = '<>=!~[;@ ';

export function parseRequirements(file, relName) {
  const out = [];
  fs.readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    const s = raw.split('#')[0].trim();
    if (!s || s.startsWith('-')) return;
    let cut = s.length;
    for (const c of REQ_OPS) { const k = s.indexOf(c); if (k !== -1 && k < cut) cut = k; }
    const spec = s.slice(cut).replace(/^\[[^\]]*\]/, '').split(';')[0].trim();
    out.push({
      name: s.slice(0, cut).trim(), spec, ecosystem: 'pypi', file: relName, line: i + 1,
      has_upper_bound: spec.includes('<') || spec.includes('==') || spec.includes('~='),
    });
  });
  return out;
}

export function npmHasUpperBound(spec) {
  const s = (spec || '').trim();
  if (!s || s === '*' || s === 'latest' || s === 'x') return false;
  if (s.includes('<')) return true;
  if (s.startsWith('>')) return false;
  return /^[\^~]?\d/.test(s) || /^[\^~]/.test(s);
}

export function parsePackageJson(file, relName) {
  const text = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(text);
  const lines = text.split('\n');
  const out = [];
  for (const group of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [name, spec] of Object.entries(json[group] || {})) {
      const idx = lines.findIndex((l) => l.includes(`"${name}"`) && l.includes(`"${spec}"`));
      out.push({ name, spec, ecosystem: 'npm', group, file: relName, line: idx === -1 ? 1 : idx + 1, has_upper_bound: npmHasUpperBound(spec) });
    }
  }
  return out;
}

export function scanRepo(repo) {
  const deps = [];
  for (const f of fs.readdirSync(repo)) {
    if (/^requirements.*\.txt$/.test(f)) deps.push(...parseRequirements(path.join(repo, f), f));
  }
  if (exists(path.join(repo, 'package.json'))) deps.push(...parsePackageJson(path.join(repo, 'package.json'), 'package.json'));
  return { tag: 'OBSERVED', source: 'scan', dependencies: deps };
}
