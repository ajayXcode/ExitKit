import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { runPipeline, verifyCapsule } from '../src/index.js';

const git = (c, cwd) => execSync(c, { cwd, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).toString();

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ek-e2e-'));
  const repo = path.join(root, 'target');
  fs.mkdirSync(repo);
  fs.writeFileSync(path.join(repo, 'requirements.txt'), 'fastapi>=0.110,<1\nanthropic>=0.40\nopenai>=1.40\n');
  fs.writeFileSync(path.join(repo, 'agent.py'), 'MODELS = {"a": "claude-sonnet-4-5"}\n\ndef run():\n    import anthropic\n    return anthropic.Anthropic()\n');
  git('git init -q -b main && git add -A && git commit -q -m init', repo);
  // build the diff the "model" will return
  fs.writeFileSync(path.join(repo, 'agent.py'), 'MODELS = {"a": "local-model"}\n\ndef run():\n    return None\n');
  const diff = git('git diff', repo);
  git('git checkout -q .', repo);
  return { root, repo, diff };
}

function modelServer(diff, files) {
  const body = JSON.stringify({ choices: [{ message: { content: '```json\n' + JSON.stringify({
    plan: ['route through openai-compatible client'], diff,
    claims: [
      { id: 'c1', type: 'only_used_in', statement: 'anthropic is only used in agent.py', params: { package: 'anthropic', files } },
      { id: 'c2', type: 'only_used_in', statement: 'anthropic is used in server.py', params: { package: 'anthropic', files: ['server.py'] } },
      { id: 'c3', type: 'other', statement: 'thinking has no equivalent', params: {} },
    ] }) + '\n```' } }] });
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => { req.resume(); req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(body); }); });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}

test('end to end: pipeline, capsule, ledger, verify', async () => {
  const { root, repo, diff } = makeRepo();
  const srv = await modelServer(diff, ['agent.py']);
  process.env.EXITKIT_BASE_URL = `http://127.0.0.1:${srv.address().port}/v1`;
  process.env.EXITKIT_MODEL = 'mock';
  try {
    const work = path.join(root, 'work');
    const cap = await runPipeline(repo, { package: 'anthropic', work, out: path.join(root, 'out') });
    assert.equal(cap.dependency.name, 'anthropic');
    assert.deepEqual(cap.ai_analysis.accuracy, { total: 3, confirmed: 1, refuted: 1, unverifiable: 1 });
    assert.equal(cap.proposed_changes.status, 'verified');
    assert.ok(cap.verification.not_run.some((n) => /no tests found/.test(n.reason)));
    assert.ok(cap.unresolved.some((u) => /Refuted AI claim c2/.test(u.text)));
    assert.ok(cap.ai_analysis.claims.every((c) => c.tag === 'AI-GENERATED'));
    assert.ok(cap.risk_indicators.some((r) => /no upper version bound/.test(r.text)));
    assert.ok(fs.existsSync(path.join(root, 'out', 'capsule.md')));
    // original checkout never edited
    assert.match(fs.readFileSync(path.join(repo, 'agent.py'), 'utf8'), /import anthropic/);
    const v = verifyCapsule(path.join(root, 'out', 'capsule.json'), {});
    assert.equal(v.ok, true, JSON.stringify(v, null, 1));
    assert.ok(v.results.some((r) => r.phase === 'after'));
  } finally { srv.close(); delete process.env.EXITKIT_BASE_URL; delete process.env.EXITKIT_MODEL; }
});

test('without a model the capsule records not_run and an unapplied patch', async () => {
  const { root, repo } = makeRepo();
  delete process.env.EXITKIT_BASE_URL; delete process.env.EXITKIT_MODEL;
  const cap = await runPipeline(repo, { package: 'anthropic', work: path.join(root, 'w') });
  assert.equal(cap.ai_analysis.status, 'not_run');
  assert.equal(cap.proposed_changes.status, 'proposed');
  assert.ok(cap.unresolved.some((u) => /AI analysis not_run/.test(u.text)));
});

test('CLI help and scan run', () => {
  const bin = fileURLToPath(new URL('../bin/exitkit.js', import.meta.url));
  assert.match(spawnSync('node', [bin, '--help'], { encoding: 'utf8' }).stdout, /exitkit/);
  const { repo, root } = makeRepo();
  const r = spawnSync('node', [bin, 'scan', repo, '--work', path.join(root, 'w')], { encoding: 'utf8' });
  assert.match(r.stdout, /anthropic.*NO UPPER BOUND/);
});
