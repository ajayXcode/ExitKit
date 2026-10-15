import {
  Repository,
  AnalysisRun,
  Capsule,
  ShareLink,
  User,
  Organization,
} from './models/types';

const uid = () => Math.random().toString(36).substring(2, 10);

// Seed User & Organization
export const currentUser: User = {
  id: 'usr_ajay_01',
  name: 'Ajay Yadav',
  email: 'ajay@exitkit.dev',
  githubUsername: 'ajayXcode',
  avatarUrl: 'https://github.com/ajayXcode.png',
  role: 'owner',
  createdAt: '2026-10-15T12:00:00Z',
};

export const currentOrg: Organization = {
  id: 'org_exitkit_01',
  name: 'ExitKit Core',
  slug: 'exitkit-core',
  plan: 'pro',
  createdAt: '2026-10-15T12:00:00Z',
};

// Demonstration Capsule for Hermes Skill Deck (per Master Document)
export const demoCapsule: Capsule = {
  id: 'cap_hermes_anthropic',
  runId: 'run_hermes_01',
  repoId: 'repo_hermes_deck',
  schema_version: '1.0',
  generated_at: '2026-10-15T13:00:00.000Z',
  tool: {
    name: 'exitkit',
    version: '0.1.0',
  },
  repository: {
    name: 'hermes-skill-deck',
    path: '/repos/runninwithitmarketing/hermes-skill-deck',
    commit: 'a4b8c91d8e23f40192837465abcde9876543210f',
    dirty: false,
  },
  dependency: {
    name: 'anthropic',
    ecosystem: 'pip',
    spec: 'anthropic>=0.40',
    manifest: 'requirements.txt:2',
  },
  maintenance_problem: {
    tag: 'OBSERVED',
    source: 'capsule',
    text: 'Exit the proprietary anthropic SDK path in agent.py and make a local open-weight model work through the OpenAI-compatible route the repo already uses.',
  },
  risk_indicators: [
    {
      tag: 'OBSERVED',
      source: 'risk',
      id: 'no-upper-bound',
      text: 'anthropic>=0.40 has NO UPPER BOUND; future breaking changes may break builds silently.',
      evidence: [{ file: 'requirements.txt', line: 2 }],
    },
    {
      tag: 'OBSERVED',
      source: 'risk',
      id: 'vendor-lock-in',
      text: 'Proprietary cloud SDK with no fallback route configured in agent.py.',
      evidence: [{ file: 'agent.py', line: 14 }],
    },
    {
      tag: 'OBSERVED',
      source: 'risk',
      id: 'hardcoded-model-id',
      text: 'Hardcoded proprietary model IDs ("claude-3-5-sonnet", "claude-3-opus") found in configuration maps.',
      evidence: [{ file: 'agent.py', line: 8 }],
    },
  ],
  usage_locations: [
    {
      tag: 'OBSERVED',
      source: 'usages',
      file: 'agent.py',
      line: 12,
      text: 'import anthropic',
    },
    {
      tag: 'OBSERVED',
      source: 'usages',
      file: 'agent.py',
      line: 28,
      text: 'self.client = anthropic.Anthropic(api_key=key)',
    },
    {
      tag: 'OBSERVED',
      source: 'usages',
      file: 'agent.py',
      line: 45,
      text: 'response = self.client.messages.create(model=model, messages=messages)',
    },
  ],
  footprint: {
    symbols: ['anthropic', 'Anthropic', 'messages.create'],
    call_sites: 2,
    files: ['agent.py'],
    exit_difficulty: 8,
    formula: 'difficulty = round(symbols*1.5 + callsites*0.8 + files*2.0)',
  },
  ai_analysis: {
    tag: 'AI-GENERATED',
    source: 'ai',
    status: 'ok',
    model: 'qwen2.5-coder-32b-instruct',
    reason: null,
    plan: [
      'Replace direct anthropic.Anthropic client with unified OpenAI-compatible client route',
      'Point base_url to local open-weight model gateway (EXITKIT_BASE_URL)',
      'Convert messages.create parameter schema to standard chat completions format',
      'Remove anthropic dependency from requirements.txt',
    ],
    claims: [
      {
        id: 'c1',
        tag: 'AI-GENERATED',
        source: 'ai',
        type: 'only_used_in',
        statement: 'anthropic is only imported and used within agent.py',
        params: { package: 'anthropic', files: ['agent.py'] },
        verdict: 'CONFIRMED',
        verdictSource: 'usages_verifier',
        evidence: [{ matches: ['agent.py:12', 'agent.py:28', 'agent.py:45'] }],
      },
      {
        id: 'c2',
        tag: 'AI-GENERATED',
        source: 'ai',
        type: 'only_used_in',
        statement: 'anthropic client is also imported in server.py',
        params: { package: 'anthropic', files: ['server.py'] },
        verdict: 'REFUTED',
        verdictSource: 'usages_verifier',
        evidence: [{ actual_files: ['agent.py'] }],
      },
      {
        id: 'c3',
        tag: 'AI-GENERATED',
        source: 'ai',
        type: 'schema_compat',
        statement: 'Payload messages format matches OpenAI chat completions',
        params: { format: 'chat.completions' },
        verdict: 'CONFIRMED',
        verdictSource: 'schema_compat_verifier',
        evidence: [{ compatible_fields: ['role', 'content'] }],
      },
      {
        id: 'c4',
        tag: 'AI-GENERATED',
        source: 'ai',
        type: 'runtime_behavior',
        statement: 'Streaming SSE chunks behave identically under local vLLM endpoint',
        params: { sse: true },
        verdict: 'UNVERIFIABLE',
        verdictSource: 'runtime_check',
        evidence: [{ reason: 'fake-server runtime verifier not enabled for dry run' }],
      },
    ],
    accuracy: {
      total: 4,
      confirmed: 2,
      refuted: 1,
      unverifiable: 1,
    },
  },
  proposed_changes: {
    diff_tag: 'AI-GENERATED',
    status: 'verified',
    diff: `--- a/agent.py
+++ b/agent.py
@@ -12,5 +12,5 @@
-import anthropic
+import openai
 import os
 
-MODELS = {"claude": "claude-3-5-sonnet-20241022"}
+MODELS = {"default": os.getenv("EXITKIT_MODEL", "qwen2.5-coder")}
@@ -28,3 +28,3 @@
-        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
+        self.client = openai.OpenAI(base_url=os.getenv("EXITKIT_BASE_URL", "http://localhost:8000/v1"), api_key="dummy")
--- a/requirements.txt
+++ b/requirements.txt
@@ -2,1 +2,0 @@
-anthropic>=0.40
`,
    branch: 'exitkit/exit-anthropic',
    worktree: '/tmp/exitkit-worktree-hermes',
    error: null,
    apply_commands: [
      'git checkout -b exitkit/exit-anthropic',
      'git apply --check patch.diff',
      'git apply patch.diff',
    ],
  },
  verification: {
    baseline: [
      {
        tag: 'EXECUTED',
        source: 'checks',
        id: 'compile',
        status: 'passed',
        cmd: 'python -m compileall -q .',
        exit: 0,
        seconds: 0.42,
      },
      {
        tag: 'OBSERVED',
        source: 'checks',
        id: 'tests',
        status: 'not_run',
        reason: 'no tests found in repository root',
      },
    ],
    after: [
      {
        tag: 'EXECUTED',
        source: 'checks',
        id: 'compile',
        status: 'passed',
        cmd: 'python -m compileall -q .',
        exit: 0,
        seconds: 0.38,
      },
      {
        tag: 'OBSERVED',
        source: 'checks',
        id: 'tests',
        status: 'not_run',
        reason: 'no tests found in repository root',
      },
    ],
    passed: ['baseline:compile', 'after:compile'],
    failed: [],
    not_run: [
      { id: 'baseline:tests', reason: 'no tests found in repository root' },
      { id: 'after:tests', reason: 'no tests found in repository root' },
    ],
    comparison: [
      {
        id: 'compile',
        baseline: 'passed',
        after: 'passed',
        regression: false,
      },
      {
        id: 'tests',
        baseline: 'not_run',
        after: 'not_run',
        regression: false,
      },
    ],
    comparison_method: 'exit code and sha256 of normalized output',
  },
  gaps: [
    {
      tag: 'OBSERVED',
      source: 'capsule',
      text: 'no test suite ran, so behaviour preservation is not demonstrated by tests',
    },
  ],
  unresolved: [
    {
      tag: 'OBSERVED',
      source: 'capsule',
      text: 'Refuted AI claim c2: anthropic client is also imported in server.py',
    },
    {
      tag: 'OBSERVED',
      source: 'capsule',
      text: '1 AI claim(s) could not be verified automatically',
    },
  ],
  out_of_scope: 'Security vulnerabilities were deliberately out of scope: no CVE or advisory data was used.',
};

// In-Memory Database
interface DBStore {
  repositories: Repository[];
  runs: AnalysisRun[];
  capsules: Map<string, Capsule>;
  shareLinks: Map<string, ShareLink>;
}

const db: DBStore = {
  repositories: [
    {
      id: 'repo_hermes_deck',
      orgId: 'org_exitkit_01',
      name: 'hermes-skill-deck',
      fullName: 'runninwithitmarketing/hermes-skill-deck',
      defaultBranch: 'main',
      isPrivate: false,
      cloneUrl: 'https://github.com/runninwithitmarketing/hermes-skill-deck.git',
      description: 'The official demonstration target for ExitKit maintenance exit',
      lastScannedAt: '2026-10-15T12:30:00Z',
      dependencies: [
        {
          id: 'dep_anthropic',
          name: 'anthropic',
          ecosystem: 'pip',
          spec: 'anthropic>=0.40',
          manifestFile: 'requirements.txt',
          manifestLine: 2,
          riskScore: 84,
          exitDifficulty: 8,
          symbolsCount: 3,
          callSitesCount: 2,
          filesCount: 1,
          signals: [
            {
              id: 'sig_1',
              tag: 'OBSERVED',
              text: 'NO UPPER BOUND on dependency version in requirements.txt',
              evidence: [{ file: 'requirements.txt', line: 2 }],
            },
            {
              id: 'sig_2',
              tag: 'OBSERVED',
              text: 'Vendor lock-in: proprietary SDK with no open fallback',
              evidence: [{ file: 'agent.py', line: 14 }],
            },
          ],
        },
        {
          id: 'dep_openai',
          name: 'openai',
          ecosystem: 'pip',
          spec: 'openai>=1.40',
          manifestFile: 'requirements.txt',
          manifestLine: 3,
          riskScore: 32,
          exitDifficulty: 5,
          symbolsCount: 2,
          callSitesCount: 4,
          filesCount: 2,
          signals: [
            {
              id: 'sig_3',
              tag: 'OBSERVED',
              text: 'NO UPPER BOUND on dependency version',
              evidence: [{ file: 'requirements.txt', line: 3 }],
            },
          ],
        },
      ],
    },
    {
      id: 'repo_exitkit',
      orgId: 'org_exitkit_01',
      name: 'ExitKit',
      fullName: 'ajayXcode/ExitKit',
      defaultBranch: 'main',
      isPrivate: false,
      cloneUrl: 'https://github.com/ajayXcode/ExitKit.git',
      description: 'The open-source core CLI and Agent Skill engine',
      lastScannedAt: '2026-10-15T13:10:00Z',
      dependencies: [],
    },
  ],
  runs: [
    {
      id: 'run_hermes_01',
      repoId: 'repo_hermes_deck',
      repoFullName: 'runninwithitmarketing/hermes-skill-deck',
      ref: 'main',
      packageName: 'anthropic',
      status: 'completed',
      currentStep: '9/9 capsule_ready',
      progressPercent: 100,
      model: 'qwen2.5-coder-32b-instruct',
      logs: [
        '[1/9] scan: 3 dependencies detected in requirements.txt',
        '[2/9] risk: scored anthropic (84/100, high maintenance risk: no upper bound, vendor lock-in)',
        '[3/9] select: selected dependency "anthropic"',
        '[4/9] usages: 3 occurrences found across 1 file (agent.py)',
        '[5/9] baseline checks: compile (passed), tests (not_run)',
        '[6/9] AI analysis: generated migration plan and unified diff',
        '[7/9] claim ledger: 4 claims evaluated (2 confirmed, 1 refuted, 1 unverifiable)',
        '[8/9] patch worktree: verified git apply in isolated worktree',
        '[9/9] capsule: Dependency Exit Capsule generated & validated against schema 1.0',
      ],
      capsuleId: 'cap_hermes_anthropic',
      startedAt: '2026-10-15T12:55:00Z',
      completedAt: '2026-10-15T13:00:00Z',
    },
  ],
  capsules: new Map([['cap_hermes_anthropic', demoCapsule]]),
  shareLinks: new Map(),
};

// Store Operations
export function getRepositories(): Repository[] {
  return db.repositories;
}

export function getRepository(id: string): Repository | undefined {
  return db.repositories.find((r) => r.id === id || r.fullName.toLowerCase() === id.toLowerCase());
}

export function addRepository(repo: Partial<Repository>): Repository {
  const newRepo: Repository = {
    id: `repo_${uid()}`,
    orgId: currentOrg.id,
    name: repo.name || 'unnamed-repo',
    fullName: repo.fullName || `ajayXcode/${repo.name || 'repo'}`,
    defaultBranch: repo.defaultBranch || 'main',
    isPrivate: !!repo.isPrivate,
    cloneUrl: repo.cloneUrl || `https://github.com/${repo.fullName}.git`,
    description: repo.description || 'Connected repository',
    lastScannedAt: new Date().toISOString(),
    dependencies: repo.dependencies || [],
  };
  db.repositories.unshift(newRepo);
  return newRepo;
}

export function getRuns(): AnalysisRun[] {
  return db.runs;
}

export function getRun(id: string): AnalysisRun | undefined {
  return db.runs.find((r) => r.id === id);
}

export function createRun(data: {
  repoId: string;
  ref?: string;
  packageName: string;
  model?: string;
}): AnalysisRun {
  const repo = getRepository(data.repoId);
  const runId = `run_${uid()}`;
  const newRun: AnalysisRun = {
    id: runId,
    repoId: data.repoId,
    repoFullName: repo ? repo.fullName : data.repoId,
    ref: data.ref || 'main',
    packageName: data.packageName,
    status: 'queued',
    currentStep: '1/9 scan',
    progressPercent: 10,
    model: data.model || 'open-weight-gateway',
    logs: [`[1/9] Job queued for ${data.packageName} on ${repo ? repo.fullName : data.repoId}`],
    startedAt: new Date().toISOString(),
  };
  db.runs.unshift(newRun);
  return newRun;
}

export function updateRun(id: string, updates: Partial<AnalysisRun>): AnalysisRun | undefined {
  const run = getRun(id);
  if (!run) return undefined;
  Object.assign(run, updates);
  return run;
}

export function getCapsules(): Capsule[] {
  return Array.from(db.capsules.values());
}

export function getCapsule(id: string): Capsule | undefined {
  return db.capsules.get(id);
}

export function saveCapsule(capsule: Capsule): Capsule {
  db.capsules.set(capsule.id, capsule);
  return capsule;
}

export function verifyCapsule(id: string): { ok: boolean; results: unknown[]; details: string } {
  const capsule = getCapsule(id);
  if (!capsule) {
    return { ok: false, results: [], details: 'Capsule not found' };
  }
  const comparisons = capsule.verification.comparison.map((c) => ({
    checkId: c.id,
    baseline: c.baseline,
    after: c.after,
    regression: c.regression,
    verified: !c.regression,
  }));
  const hasRegressions = comparisons.some((c) => c.regression);
  return {
    ok: !hasRegressions,
    results: comparisons,
    details: hasRegressions
      ? 'Verification failed: regressions observed between baseline and after checks'
      : 'All checks verified. No regressions detected in worktree execution.',
  };
}

export function createShareLink(capsuleId: string): ShareLink {
  const token = uid() + uid() + uid();
  const link: ShareLink = {
    id: `sh_${uid()}`,
    capsuleId,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    revoked: false,
  };
  db.shareLinks.set(token, link);
  return link;
}

export function getShareLink(token: string): ShareLink | undefined {
  const link = db.shareLinks.get(token);
  if (link && !link.revoked && new Date(link.expiresAt) > new Date()) {
    return link;
  }
  return undefined;
}
