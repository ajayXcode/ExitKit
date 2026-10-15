import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseRequirements, npmHasUpperBound } from '../src/scan.js';
import { findUsages } from '../src/usages.js';
import { add } from '../src/provenance.js';
import { validate } from '../src/schema.js';
import { runLedger, checkToolSchema } from '../src/verifiers.js';
import { normalize } from '../src/util.js';
import { parseModelJSON, cleanClaims } from '../src/analyze.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ek-'));

test('requirements parser finds names, specs, lines and upper bounds', () => {
  const d = tmp(); const f = path.join(d, 'requirements.txt');
  fs.writeFileSync(f, 'fastapi>=0.110,<1\n# c\nuvicorn[standard]>=0.29,<1\nanthropic>=0.40\nopenai>=1.40  # x\nPyYAML>=6,<7\n');
  const deps = parseRequirements(f, 'requirements.txt');
  const by = Object.fromEntries(deps.map((x) => [x.name, x]));
  assert.equal(by.anthropic.has_upper_bound, false);
  assert.equal(by.openai.has_upper_bound, false);
  assert.equal(by.fastapi.has_upper_bound, true);
  assert.equal(by.uvicorn.has_upper_bound, true);
  assert.equal(by.PyYAML.has_upper_bound, true);
  assert.equal(by.anthropic.line, 4);
});

test('npm bound detection', () => {
  assert.equal(npmHasUpperBound('^1.2.3'), true);
  assert.equal(npmHasUpperBound('*'), false);
  assert.equal(npmHasUpperBound('>=1.0.0'), false);
  assert.equal(npmHasUpperBound('>=1 <2'), true);
});

test('usages finds nested imports and footprint', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'agent.py'), 'def a():\n    import anthropic\n    c = anthropic.Anthropic()\n    c2 = anthropic.Anthropic()\n    return anthropic.types\n\n# import anthropic\n');
  fs.writeFileSync(path.join(d, 'other.py'), 'import os\n');
  const u = findUsages(d, 'anthropic', 'pypi');
  assert.deepEqual(u.usages.map((x) => [x.file, x.line]), [['agent.py', 2]]);
  assert.deepEqual(u.footprint.symbols, ['anthropic.Anthropic', 'anthropic.types']);
  assert.equal(u.footprint.call_sites, 3);
});

test('usages handles alias map for PyYAML and JS requires', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'a.py'), 'import yaml\nyaml.safe_load("x")\n');
  fs.writeFileSync(path.join(d, 'b.js'), "const { Foo } = require('left-pad');\nFoo();\n");
  assert.equal(findUsages(d, 'PyYAML', 'pypi').usages.length, 1);
  const js = findUsages(d, 'left-pad', 'npm');
  assert.equal(js.usages.length, 1);
  assert.deepEqual(js.footprint.symbols, ['left-pad.Foo']);
});

test('provenance: AI cannot emit OBSERVED or EXECUTED', () => {
  assert.throws(() => add([], { tag: 'OBSERVED', source: 'ai', text: 'x' }), /provenance violation/);
  assert.throws(() => add([], { tag: 'EXECUTED', source: 'ai', text: 'x', evidence: [{ cmd: 'a', exit: 0 }] }), /provenance violation/);
  assert.doesNotThrow(() => add([], { tag: 'AI-GENERATED', source: 'ai', text: 'x' }));
});

test('provenance: verdicts only from ledger, EXECUTED needs cmd+exit', () => {
  assert.throws(() => add([], { tag: 'AI-GENERATED', source: 'ai', text: 'x', verdict: 'CONFIRMED' }), /verdicts/);
  assert.doesNotThrow(() => add([], { tag: 'AI-GENERATED', source: 'ai', text: 'x', verdict: 'CONFIRMED', verdictSource: 'ledger' }));
  assert.throws(() => add([], { tag: 'EXECUTED', source: 'checks', text: 'x' }), /cmd and exit/);
});

test('schema validator catches missing and wrong fields', () => {
  const s = { type: 'object', required: ['a'], properties: { a: { type: 'string', enum: ['x'] }, b: { type: 'array', items: { type: 'integer' } } } };
  assert.deepEqual(validate(s, { a: 'x', b: [1] }), []);
  assert.ok(validate(s, {}).some((e) => /missing required "a"/.test(e)));
  assert.ok(validate(s, { a: 'y' }).length);
  assert.ok(validate(s, { a: 'x', b: ['q'] }).length);
});

test('ledger: wrong file list is REFUTED, right is CONFIRMED, others UNVERIFIABLE', () => {
  const usages = { package: 'anthropic', usages: [{ package: 'anthropic', file: 'agent.py', line: 2 }] };
  const r = runLedger([
    { id: '1', type: 'only_used_in', statement: 's', params: { package: 'anthropic', files: ['agent.py'] } },
    { id: '2', type: 'only_used_in', statement: 's', params: { package: 'anthropic', files: ['agent.py', 'server.py'] } },
    { id: '3', type: 'runtime_behavior', statement: 's', params: {} },
    { id: '4', type: 'other', statement: 's', params: {} },
  ], { repo: tmp(), usages });
  assert.deepEqual(r.claims.map((c) => c.verdict), ['CONFIRMED', 'REFUTED', 'UNVERIFIABLE', 'UNVERIFIABLE']);
  assert.deepEqual(r.summary, { total: 4, confirmed: 1, refuted: 1, unverifiable: 2 });
});

test('schema_compat verifier', () => {
  assert.deepEqual(checkToolSchema({ input_schema: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] } }), []);
  assert.ok(checkToolSchema({ input_schema: { type: 'object', properties: {}, required: ['q'] } }).length);
  const d = tmp(); fs.writeFileSync(path.join(d, 't.json'), JSON.stringify([{ input_schema: { type: 'string' } }]));
  const r = runLedger([{ id: '1', type: 'schema_compat', statement: 's', params: { schemas_file: 't.json' } }], { repo: d, usages: { usages: [] } });
  assert.equal(r.claims[0].verdict, 'REFUTED');
});

test('schemas_file cannot escape the repo', () => {
  const r = runLedger([{ id: '1', type: 'schema_compat', statement: 's', params: { schemas_file: '../../etc/passwd' } }], { repo: tmp(), usages: { usages: [] } });
  assert.equal(r.claims[0].verdict, 'UNVERIFIABLE');
});

test('normalize strips durations, timestamps and paths', () => {
  const n = normalize('ran in 1.2s at 2026-10-15T10:00:00Z in /x/y', '/x/y');
  assert.equal(n, 'ran in <DUR> at <TS> in <CWD>');
});

test('model JSON parsing tolerates fences and drops bad claims', () => {
  assert.deepEqual(parseModelJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseModelJSON('here: {"a":2} done'), { a: 2 });
  assert.throws(() => parseModelJSON('nope'));
  const { claims, dropped } = cleanClaims([{ statement: 's', type: 'weird' }, { nostatement: 1 }]);
  assert.equal(claims[0].type, 'other'); assert.equal(dropped.length, 1);
});
