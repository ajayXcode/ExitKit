import http from 'node:http';

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    const pass = res.status >= 200 && res.status < 300;
    console.log(`${pass ? '✓' : '✖'} [${res.status}] ${name}: ${url}`);
    if (!pass) console.error('  Error response:', data);
    return pass;
  } catch (err) {
    console.error(`✖ ${name}: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('Testing ExitKit Cloud endpoints on http://localhost:3000...\n');
  const base = 'http://localhost:3000';

  const results = [];
  results.push(await testEndpoint('Health Check', `${base}/api/health`));
  results.push(await testEndpoint('List Repositories', `${base}/api/repos`));
  results.push(await testEndpoint('Get Repository Detail', `${base}/api/repos/repo_hermes_deck`));
  results.push(await testEndpoint('Scan Repository', `${base}/api/repos/repo_hermes_deck/scan`, { method: 'POST' }));
  results.push(await testEndpoint('List Runs', `${base}/api/runs`));
  results.push(await testEndpoint('Get Run Detail', `${base}/api/runs/run_hermes_01`));
  results.push(await testEndpoint('List Capsules', `${base}/api/capsules`));
  results.push(await testEndpoint('Get Capsule Detail', `${base}/api/capsules/cap_hermes_anthropic`));
  results.push(await testEndpoint('Verify Capsule Checks', `${base}/api/capsules/cap_hermes_anthropic/verify`, { method: 'POST' }));
  results.push(await testEndpoint('Generate Share Link', `${base}/api/capsules/cap_hermes_anthropic/share`, { method: 'POST' }));
  results.push(await testEndpoint('Auth Session', `${base}/api/auth/session`));
  results.push(await testEndpoint('Auth Login', `${base}/api/auth/login`, { method: 'POST' }));
  results.push(await testEndpoint('Model Gateway Chat', `${base}/api/gateway/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5-coder', messages: [{ role: 'user', content: 'exit anthropic' }] })
  }));

  const passed = results.filter(Boolean).length;
  console.log(`\nEndpoint Verification Summary: ${passed}/${results.length} passed.`);
  process.exit(passed === results.length ? 0 : 1);
}

run();
