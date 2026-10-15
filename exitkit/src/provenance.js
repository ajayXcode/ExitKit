// Provenance rule: every capsule entry has exactly one tag, and each tag may only come from allowed sources.
export const RULES = {
  OBSERVED: new Set(['scan', 'risk', 'usages', 'checks', 'capsule']),
  EXECUTED: new Set(['checks', 'patch']),
  'AI-GENERATED': new Set(['ai']),
};

export function add(entries, { tag, source, text, evidence = [], verdict, verdictSource, ...extra }) {
  if (!RULES[tag]) throw new Error(`unknown tag ${tag}`);
  if (!RULES[tag].has(source)) throw new Error(`provenance violation: source "${source}" may not emit ${tag}`);
  if (verdict !== undefined && verdictSource !== 'ledger') throw new Error('provenance violation: verdicts may only come from the ledger');
  if (tag === 'EXECUTED') {
    const e = evidence[0];
    if (!e || typeof e.cmd !== 'string' || typeof e.exit !== 'number') throw new Error('provenance violation: EXECUTED entries need evidence with cmd and exit code');
  }
  const entry = { tag, source, text, evidence, ...extra };
  if (verdict !== undefined) entry.verdict = verdict;
  entries.push(entry);
  return entry;
}
