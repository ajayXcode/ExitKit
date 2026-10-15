import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { validatePatchScope, changedFiles } from '../src/patch.js';
import { checkExitInvariants } from '../src/invariants.js';
import { runPipeline } from '../src/index.js';

const git = (c, cwd) => execSync(c, { cwd, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).toString();

test('patch scope validation: accepts clean unified diff within limits', () => {
  const diff = `--- a/agent.py\n+++ b/agent.py\n@@ -1 +1 @@\n-import anthropic\n+import openai\n--- a/requirements.txt\n+++ b/requirements.txt\n@@ -1 +1 @@\n-anthropic\n+openai\n`;
  const res = validatePatchScope(diff, { maxFiles: 5 });
  assert.equal(res.valid, true);
  assert.deepEqual(res.files, ['agent.py', 'requirements.txt']);
});

test('patch scope validation: rejects directory traversal and path escapes', () => {
  const traversalDiff = `--- a/../../evil.py\n+++ b/../../evil.py\n@@ -1 +1 @@\n+malicious_payload\n`;
  const res = validatePatchScope(traversalDiff);
  assert.equal(res.valid, false);
  assert.match(res.error, /escapes repository root/);
});

test('patch scope validation: rejects diff exceeding maxFiles limit', () => {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    lines.push(`--- a/file_${i}.py\n+++ b/file_${i}.py\n@@ -1 +1 @@\n+x\n`);
  }
  const bigDiff = lines.join('');
  const res = validatePatchScope(bigDiff, { maxFiles: 5 });
  assert.equal(res.valid, false);
  assert.match(res.error, /patch scope exceeded/);
});

test('exit invariants: verifies removal from manifest, zero usages, and no regressions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ek-inv-'));
  fs.writeFileSync(path.join(root, 'requirements.txt'), 'fastapi>=0.110\nopenai>=1.40\n');
  fs.writeFileSync(path.join(root, 'agent.py'), 'import openai\n');

  // Both manifest cleaned and usages 0
  const cleanResult = checkExitInvariants(root, 'anthropic', 'pip', []);
  assert.equal(cleanResult.ok, true);
  assert.equal(cleanResult.passed_count, 3);

  // Invariant failure 1: Dependency still declared in manifest
  fs.writeFileSync(path.join(root, 'requirements.txt'), 'fastapi>=0.110\nanthropic>=0.40\n');
  const dirtyManifest = checkExitInvariants(root, 'anthropic', 'pip', []);
  assert.equal(dirtyManifest.ok, false);
  assert.equal(dirtyManifest.invariants.find((i) => i.id === 'manifest_removed').pass, false);

  // Invariant failure 2: Code usage left behind in another file
  fs.writeFileSync(path.join(root, 'requirements.txt'), 'fastapi>=0.110\n');
  fs.writeFileSync(path.join(root, 'agent.py'), 'import anthropic\n');
  const dirtyUsages = checkExitInvariants(root, 'anthropic', 'pip', []);
  assert.equal(dirtyUsages.ok, false);
  assert.equal(dirtyUsages.invariants.find((i) => i.id === 'usages_eliminated').pass, false);

  // Invariant failure 3: Check regression
  const regressed = checkExitInvariants(root, 'openai', 'pip', [{ id: 'compile', regression: true }]);
  assert.equal(regressed.ok, false);
  assert.equal(regressed.invariants.find((i) => i.id === 'no_check_regressions').pass, false);
});

test('truthful verification: migration stays applied (NOT verified) if an import is left behind', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ek-e2e-inv-'));
  const repo = path.join(root, 'target');
  fs.mkdirSync(repo);
  fs.writeFileSync(path.join(repo, 'requirements.txt'), 'fastapi>=0.110\nanthropic>=0.40\n');
  fs.writeFileSync(path.join(repo, 'agent.py'), 'import anthropic\n');
  fs.writeFileSync(path.join(repo, 'server.py'), 'import anthropic\n# leftover import that model does not touch\n');
  git('git init -q -b main && git add -A && git commit -q -m init', repo);

  // The model's diff only removes anthropic from agent.py, but forgets server.py!
  fs.writeFileSync(path.join(repo, 'requirements.txt'), 'fastapi>=0.110\n');
  fs.writeFileSync(path.join(repo, 'agent.py'), '# migrated to local\n');
  const incompleteDiff = git('git diff', repo);
  git('git checkout -q .', repo);

  // Mock server returning this incomplete diff
  const body = JSON.stringify({
    choices: [{
      message: {
        content: JSON.stringify({
          plan: ['migrate agent.py only'],
          diff: incompleteDiff,
          claims: [{ id: 'c1', type: 'other', statement: 'safe exit' }],
        }),
      },
    }],
  });
  const srv = http.createServer((req, res) => {
    req.resume();
    req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(body); });
  });
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));

  process.env.EXITKIT_BASE_URL = `http://127.0.0.1:${srv.address().port}/v1`;
  process.env.EXITKIT_MODEL = 'mock';

  try {
    const work = path.join(root, 'work');
    const cap = await runPipeline(repo, { package: 'anthropic', work, out: path.join(root, 'out') });

    // The patch was applied in the worktree, but exit invariant failed (usages still in server.py)
    // Thus it MUST NOT be marked verified!
    assert.equal(cap.proposed_changes.status, 'applied');
    assert.ok(cap.unresolved.some((u) => /Exit invariant failed: No import or call sites/.test(u.text)));
    assert.ok(cap.unresolved.some((u) => /server\.py:1/.test(u.text)));
  } finally {
    srv.close();
    delete process.env.EXITKIT_BASE_URL;
    delete process.env.EXITKIT_MODEL;
  }
});
