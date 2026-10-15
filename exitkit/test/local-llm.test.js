import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { analyze, parseModelJSON, cleanClaims } from '../src/analyze.js';

function createLocalLLMServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        handler(req, body, res);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('local LLM integration: queries OpenAI-compatible endpoint and parses exit plan', async () => {
  const targetDiff = '--- a/agent.py\n+++ b/agent.py\n@@ -1,2 +1,2 @@\n-import anthropic\n+import openai\n';
  const expectedClaims = [
    { id: 'c1', type: 'only_used_in', statement: 'anthropic is only used in agent.py', params: { package: 'anthropic', files: ['agent.py'] } },
    { id: 'c2', type: 'schema_compat', statement: 'calls can be mapped to chat completions', params: {} },
  ];

  const server = await createLocalLLMServer((req, body, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/v1/chat/completions');
    const parsedBody = JSON.parse(body);
    assert.equal(parsedBody.model, 'qwen2.5-coder-32b-instruct');
    assert.equal(parsedBody.temperature, 0);

    const completion = {
      id: 'chatcmpl-test-01',
      choices: [{
        message: {
          role: 'assistant',
          content: `<think>\nAnalyzing dependency footprint and constructing diff\n</think>\n\`\`\`json\n${JSON.stringify({
            plan: ['Replace SDK import with openai', 'Update model configuration'],
            diff: targetDiff,
            claims: expectedClaims,
          })}\n\`\`\``,
        },
      }],
    };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(completion));
  });

  const apiBase = `http://127.0.0.1:${server.address().port}/v1`;

  try {
    const usages = {
      footprint: { symbols: ['Anthropic'], call_sites: 2, files: ['agent.py'], exit_difficulty: 5 },
      usages: [{ file: 'agent.py', line: 1, text: 'import anthropic' }],
    };

    const result = await analyze(process.cwd(), 'anthropic', usages, {
      apiBase,
      model: 'qwen2.5-coder-32b-instruct',
      apiKey: 'test-key',
    });

    assert.equal(result.status, 'ok');
    assert.equal(result.tag, 'AI-GENERATED');
    assert.equal(result.model, 'qwen2.5-coder-32b-instruct');
    assert.deepEqual(result.plan, ['Replace SDK import with openai', 'Update model configuration']);
    assert.equal(result.diff, targetDiff);
    assert.equal(result.claims.length, 2);
    assert.equal(result.claims[0].id, 'c1');
    assert.equal(result.claims[0].type, 'only_used_in');
    assert.equal(result.dropped_claims, 0);
  } finally {
    server.close();
  }
});

test('local LLM integration: retries when initial attempt yields malformed JSON', async () => {
  let attempts = 0;
  const server = await createLocalLLMServer((req, body, res) => {
    attempts++;
    res.setHeader('Content-Type', 'application/json');
    if (attempts === 1) {
      // First attempt returns malformed prose without valid JSON
      res.end(JSON.stringify({
        choices: [{ message: { content: 'I cannot generate JSON right now.' } }],
      }));
    } else {
      // Second attempt returns valid plan
      res.end(JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              plan: ['Migrate import'],
              diff: '',
              claims: [{ id: 'c1', type: 'other', statement: 'safe exit plan' }],
            }),
          },
        }],
      }));
    }
  });

  const apiBase = `http://127.0.0.1:${server.address().port}/v1`;

  try {
    const usages = { footprint: { symbols: [], call_sites: 0, files: [] }, usages: [] };
    const result = await analyze(process.cwd(), 'dummy', usages, {
      apiBase,
      model: 'local-test-model',
    });

    assert.equal(result.status, 'ok');
    assert.equal(attempts, 2);
    assert.equal(result.claims.length, 1);
  } finally {
    server.close();
  }
});

test('local LLM integration: gracefully records failed status when endpoint is unreachable', async () => {
  const usages = { footprint: { symbols: [], call_sites: 0, files: [] }, usages: [] };
  // Port 65530 is unlikely to be running
  const result = await analyze(process.cwd(), 'dummy', usages, {
    apiBase: 'http://127.0.0.1:65530/v1',
    model: 'offline-model',
  });

  assert.equal(result.status, 'failed');
  assert.match(result.reason, /model did not return usable JSON/);
  assert.equal(result.diff, '');
  assert.deepEqual(result.claims, []);
});

test('parseModelJSON strips think blocks, code fences, and extracts JSON accurately', () => {
  const raw = `<think>
Reasoning step 1: analyze dependencies.
Reasoning step 2: emit exit JSON.
</think>
\`\`\`json
{
  "plan": ["step 1"],
  "diff": "patch",
  "claims": []
}
\`\`\`
Extra commentary at the bottom that is not JSON.`;

  const parsed = parseModelJSON(raw);
  assert.deepEqual(parsed.plan, ['step 1']);
  assert.equal(parsed.diff, 'patch');
});

test('live Ollama local model: generates verified analysis with qwen2.5-coder:7b', async (t) => {
  const baseUrl = process.env.EXITKIT_BASE_URL || 'http://127.0.0.1:11434/v1';
  const model = process.env.EXITKIT_MODEL || 'qwen2.5-coder:7b';

  try {
    const probe = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, { signal: AbortSignal.timeout(3000) });
    if (!probe.ok) {
      t.skip(`Ollama endpoint at ${baseUrl} is not reachable (HTTP ${probe.status})`);
      return;
    }
  } catch {
    t.skip(`Ollama endpoint at ${baseUrl} is not running`);
    return;
  }

  const usages = {
    footprint: { symbols: ['Anthropic', 'messages.create'], call_sites: 1, files: ['agent.py'], exit_difficulty: 5 },
    usages: [{ file: 'agent.py', line: 1, text: 'import anthropic' }],
  };

  const result = await analyze(process.cwd(), 'anthropic', usages, {
    apiBase: baseUrl,
    model,
    apiKey: 'ollama',
  });

  assert.equal(result.status, 'ok', `Expected status 'ok', got '${result.status}' (reason: ${result.reason})`);
  assert.equal(result.tag, 'AI-GENERATED');
  assert.equal(result.model, model);
  assert.ok(Array.isArray(result.plan), 'plan should be an array');
  assert.ok(result.plan.length > 0, 'plan should contain migration steps');
  assert.ok(Array.isArray(result.claims), 'claims should be an array');
  assert.ok(result.claims.length > 0, 'claims should contain checkable statements');
  assert.ok(result.claims.every((c) => typeof c.id === 'string' && typeof c.statement === 'string'));
});
