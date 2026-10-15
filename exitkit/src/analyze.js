import fs from 'node:fs';
import path from 'node:path';

const TYPES = new Set(['only_used_in', 'schema_compat', 'runtime_behavior', 'other']);

export function snippets(repo, usages, radius = 4) {
  const out = [];
  const seen = new Set();
  for (const u of usages.usages) {
    const key = `${u.file}:${Math.floor(u.line / (radius * 2))}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const fullPath = path.join(repo, u.file);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    const a = Math.max(0, u.line - 1 - radius), b = Math.min(lines.length, u.line + radius);
    out.push(`# ${u.file}:${a + 1}-${b}\n${lines.slice(a, b).join('\n')}`);
  }
  return out;
}

export function buildPrompt(pkg, usages, snips) {
  const system = 'You are a software maintenance analyst. Reply with ONE JSON object only, no prose, no markdown fences. Use only the supplied code snippets as evidence.';
  const user = `Goal: plan a safe exit from the dependency "${pkg}".
Footprint: ${JSON.stringify(usages.footprint)}
Snippets:
${snips.join('\n\n')}

Return JSON: {"plan":[string,...],"diff":"<unified diff, git apply compatible, or empty string>","claims":[{"id":"c1","type":"only_used_in|schema_compat|runtime_behavior|other","statement":"one sentence","params":{}}]}
Claim params: only_used_in -> {"package":"${pkg}","files":["relative/path.py"]}; schema_compat -> {"schemas_file":"relative/path.json"}; other -> {}.
Make each claim atomic and checkable.`;
  return { system, user };
}

export function parseModelJSON(text) {
  let t = String(text).trim();
  // Strip <think>...</think> blocks from reasoning models (e.g. DeepSeek-R1, QwQ)
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip code fences
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch { /* try to extract object */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a !== -1 && b > a) {
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch { /* ignore */ }
  }
  throw new Error('no JSON object in model output');
}

export function cleanClaims(raw) {
  const claims = [], dropped = [];
  (Array.isArray(raw) ? raw : []).forEach((c, i) => {
    if (c && typeof c.statement === 'string') {
      claims.push({ id: String(c.id ?? `c${i + 1}`), type: TYPES.has(c.type) ? c.type : 'other', statement: c.statement, params: c.params && typeof c.params === 'object' ? c.params : {} });
    } else dropped.push(i);
  });
  return { claims, dropped };
}

export async function analyze(repo, pkg, usages, opts = {}) {
  const env = opts?.env || process.env;
  const base = opts?.apiBase || opts?.['api-base'] || env.EXITKIT_BASE_URL;
  const model = opts?.model || env.EXITKIT_MODEL;
  const apiKey = opts?.apiKey || opts?.['api-key'] || env.EXITKIT_API_KEY || 'x';

  if (!base || !model) {
    return {
      tag: 'AI-GENERATED',
      source: 'ai',
      status: 'not_run',
      reason: 'EXITKIT_BASE_URL and EXITKIT_MODEL are not set (pass --api-base and --model or configure env vars)',
      claims: [],
      plan: [],
      diff: '',
    };
  }

  const { system, user } = buildPrompt(pkg, usages, snippets(repo, usages));
  let lastErr = 'unknown';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal: AbortSignal.timeout(300000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });
      if (!res.ok) throw new Error(`endpoint returned HTTP ${res.status}`);
      const j = await res.json();
      const content = j.choices?.[0]?.message?.content ?? '';
      const parsed = parseModelJSON(content);
      const { claims, dropped } = cleanClaims(parsed.claims);
      return {
        tag: 'AI-GENERATED',
        source: 'ai',
        status: 'ok',
        model,
        plan: Array.isArray(parsed.plan) ? parsed.plan.map(String) : [],
        diff: typeof parsed.diff === 'string' ? parsed.diff : '',
        claims,
        dropped_claims: dropped.length,
      };
    } catch (e) {
      lastErr = String(e.message || e);
    }
  }
  return {
    tag: 'AI-GENERATED',
    source: 'ai',
    status: 'failed',
    model,
    reason: `model did not return usable JSON after 2 attempts: ${lastErr}`,
    claims: [],
    plan: [],
    diff: '',
  };
}
