import fs from 'node:fs';
import { walk, rel } from './util.js';

export const VENDOR_SDKS = new Set(['anthropic', '@anthropic-ai/sdk', 'openai', 'google-generativeai', '@google/generative-ai', 'cohere', 'cohere-ai', 'mistralai', '@mistralai/mistralai']);
const MODEL_RE = /["'`]((?:claude|gpt|deepseek|glm|gemini|mistral|qwen|llama)[\w.\-:]*-[\w.\-:]*|o[134]-[\w.\-]*)["'`]/;
const STALE_MONTHS = 18;

export function findHardcodedModels(repo) {
  const hits = [];
  for (const f of walk(repo, ['.py', '.js', '.mjs', '.ts', '.tsx', '.jsx'])) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      const m = l.match(MODEL_RE);
      if (m) hits.push({ file: rel(repo, f), line: i + 1, text: m[1] });
    });
  }
  return hits;
}

async function registryLastRelease(dep) {
  const url = dep.ecosystem === 'npm' ? `https://registry.npmjs.org/${dep.name}` : `https://pypi.org/pypi/${dep.name}/json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`registry returned ${res.status}`);
  const j = await res.json();
  if (dep.ecosystem === 'npm') return new Date(j.time?.modified);
  const times = Object.values(j.releases || {}).flat().map((f) => new Date(f.upload_time_iso_8601 || f.upload_time));
  return new Date(Math.max(...times.map((d) => d.getTime())));
}

export async function scoreRisk(repo, scan, { online = false } = {}) {
  const models = findHardcodedModels(repo);
  const not_run = [];
  if (!online) not_run.push({ id: 'stale-check', reason: 'registry lookup skipped (offline mode; pass --online to enable)' });
  const dependencies = [];
  for (const d of scan.dependencies) {
    const signals = [];
    const ev = [{ file: d.file, line: d.line }];
    if (!d.has_upper_bound) signals.push({ id: 'no-upper-bound', weight: 2, text: `${d.name} has no upper version bound (spec: "${d.spec || 'none'}")`, evidence: ev });
    if (VENDOR_SDKS.has(d.name)) {
      signals.push({ id: 'vendor-sdk', weight: 2, text: `${d.name} is a vendor-specific SDK (lock-in risk)`, evidence: ev });
      if (models.length) signals.push({ id: 'hardcoded-models', weight: 1, text: `${models.length} hardcoded model identifier(s) tie the code to specific vendors`, evidence: models.slice(0, 10).map(({ file, line }) => ({ file, line })) });
    }
    if (online) {
      try {
        const last = await registryLastRelease(d);
        const months = (Date.now() - last.getTime()) / (30.44 * 864e5);
        if (months > STALE_MONTHS) signals.push({ id: 'stale', weight: 2, text: `last release ${last.toISOString().slice(0, 10)} (~${Math.round(months)} months ago)`, evidence: [{ file: d.file, line: d.line }] });
      } catch (e) { not_run.push({ id: `stale-check:${d.name}`, reason: String(e.message || e) }); }
    }
    dependencies.push({ name: d.name, ecosystem: d.ecosystem, spec: d.spec, file: d.file, line: d.line, score: signals.reduce((a, s) => a + s.weight, 0), signals: signals.map((s) => ({ tag: 'OBSERVED', source: 'risk', ...s })) });
  }
  dependencies.sort((a, b) => b.score - a.score);
  return { tag: 'OBSERVED', source: 'risk', dependencies, hardcoded_models: models, not_run, note: 'Security vulnerabilities are out of scope: no CVE or advisory data is used.' };
}
