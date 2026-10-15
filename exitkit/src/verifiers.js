import fs from 'node:fs';
import path from 'node:path';

function onlyUsedIn(claim, ctx) {
  const pkg = claim.params.package || ctx.usages.package;
  const claimed = [...new Set(claim.params.files || [])].sort();
  if (!claimed.length) return ['UNVERIFIABLE', { reason: 'claim names no files' }];
  const found = [...new Set(ctx.usages.usages.filter((u) => u.package === pkg).map((u) => u.file))].sort();
  return [JSON.stringify(found) === JSON.stringify(claimed) ? 'CONFIRMED' : 'REFUTED', { claimed_files: claimed, found_files: found }];
}

export function checkToolSchema(s) {
  const errs = [];
  if (!s || typeof s !== 'object') return ['not an object'];
  const sch = s.input_schema || s.parameters || s;
  if (sch.type !== 'object') errs.push('type must be "object"');
  if (sch.properties && typeof sch.properties !== 'object') errs.push('properties must be an object');
  if (sch.required !== undefined) {
    if (!Array.isArray(sch.required)) errs.push('required must be an array');
    else for (const r of sch.required) if (!sch.properties || !(r in sch.properties)) errs.push(`required "${r}" not in properties`);
  }
  return errs;
}

function schemaCompat(claim, ctx) {
  const f = claim.params.schemas_file;
  if (!f) return ['UNVERIFIABLE', { reason: 'claim gives no schemas_file to check' }];
  const p = path.resolve(ctx.repo, f);
  if (!p.startsWith(path.resolve(ctx.repo))) return ['UNVERIFIABLE', { reason: 'schemas_file is outside the repository' }];
  let list;
  try { list = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return ['UNVERIFIABLE', { reason: `cannot read schemas: ${e.message}` }]; }
  if (!Array.isArray(list)) list = [list];
  const problems = list.flatMap((s, i) => checkToolSchema(s).map((e) => `schema[${i}]: ${e}`));
  return [problems.length ? 'REFUTED' : 'CONFIRMED', { checked: list.length, problems }];
}

const VERIFIERS = {
  only_used_in: onlyUsedIn,
  schema_compat: schemaCompat,
  runtime_behavior: () => ['UNVERIFIABLE', { reason: 'fake-server runtime check is not implemented yet (stretch goal)' }],
};

export function runLedger(claims, ctx) {
  const results = claims.map((c) => {
    const fn = VERIFIERS[c.type];
    let verdict = 'UNVERIFIABLE', evidence = { reason: 'no automatic verifier for this claim type' };
    if (fn) { try { [verdict, evidence] = fn(c, ctx); } catch (e) { evidence = { reason: `verifier error: ${e.message}` }; } }
    return { ...c, verdict, evidence, verdict_source: 'ledger' };
  });
  const count = (v) => results.filter((r) => r.verdict === v).length;
  return { source: 'ledger', claims: results, summary: { total: results.length, confirmed: count('CONFIRMED'), refuted: count('REFUTED'), unverifiable: count('UNVERIFIABLE') } };
}
