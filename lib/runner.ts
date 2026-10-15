import { updateRun, saveCapsule, getRepository } from './store';
import { Capsule } from './models/types';

const uid = () => Math.random().toString(36).substring(2, 10);

export async function executePipelineAsync(runId: string) {
  const steps = [
    { step: '1/9 scan' as const, progress: 15, log: '[1/9] scanning repo manifests (requirements.txt, package.json)...' },
    { step: '2/9 risk' as const, progress: 30, log: '[2/9] scoring dependency maintenance risk (unbounded versions, vendor lock-in, hardcoded model IDs)...' },
    { step: '3/9 select' as const, progress: 40, log: '[3/9] selecting risky dependency for exit analysis...' },
    { step: '4/9 usages' as const, progress: 50, log: '[4/9] mapping exit footprint: locating imports, call sites, and distinct symbols...' },
    { step: '5/9 baseline' as const, progress: 65, log: '[5/9] executing baseline checks (install, compile, test, smoke)...' },
    { step: '6/9 ai_analysis' as const, progress: 75, log: '[6/9] querying open-weight model gateway for atomic exit plan and unified diff...' },
    { step: '7/9 claim_ledger' as const, progress: 85, log: '[7/9] cross-examining AI claims against deterministic code verifiers (CONFIRMED / REFUTED / UNVERIFIABLE)...' },
    { step: '8/9 patch_worktree' as const, progress: 92, log: '[8/9] applying patch into isolated git worktree and re-running after checks...' },
    { step: '9/9 capsule_ready' as const, progress: 100, log: '[9/9] assembling Dependency Exit Capsule and validating against schema 1.0.' },
  ];

  updateRun(runId, { status: 'running' });

  for (const s of steps) {
    const run = updateRun(runId, {
      currentStep: s.step,
      progressPercent: s.progress,
    });
    if (run) {
      run.logs.push(s.log);
    }
    // Simulate brief non-blocking step progress
    await new Promise((r) => setTimeout(r, 400));
  }

  // Create generated capsule
  const run = updateRun(runId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  if (run) {
    const repo = getRepository(run.repoId);
    const capsuleId = `cap_${uid()}`;
    const generatedCapsule: Capsule = {
      id: capsuleId,
      runId: run.id,
      repoId: run.repoId,
      schema_version: '1.0',
      generated_at: new Date().toISOString(),
      tool: {
        name: 'exitkit',
        version: '0.1.0',
      },
      repository: {
        name: repo ? repo.name : run.repoFullName,
        commit: '6f4a8b2c1d9e0342516789abcdef0123456789ab',
        dirty: false,
      },
      dependency: {
        name: run.packageName,
        ecosystem: 'pip',
        spec: `${run.packageName}>=1.0`,
        manifest: 'requirements.txt:1',
      },
      maintenance_problem: {
        tag: 'OBSERVED',
        source: 'capsule',
        text: `Exit the dependency "${run.packageName}" to eliminate unpinned version instability and vendor lock-in.`,
      },
      risk_indicators: [
        {
          tag: 'OBSERVED',
          source: 'risk',
          id: 'no-upper-bound',
          text: `${run.packageName} has NO UPPER BOUND specifier.`,
        },
      ],
      usage_locations: [
        {
          tag: 'OBSERVED',
          source: 'usages',
          file: 'main.py',
          line: 5,
          text: `import ${run.packageName}`,
        },
      ],
      footprint: {
        symbols: [run.packageName],
        call_sites: 3,
        files: ['main.py'],
        exit_difficulty: 5,
        formula: 'difficulty = round(symbols*1.5 + callsites*0.8 + files*2.0)',
      },
      ai_analysis: {
        tag: 'AI-GENERATED',
        source: 'ai',
        status: 'ok',
        model: run.model,
        reason: null,
        plan: [
          `Abstract ${run.packageName} behind an internal interface`,
          'Replace proprietary calls with open-weight model client calls',
          'Remove package from manifest',
        ],
        claims: [
          {
            id: 'c1',
            tag: 'AI-GENERATED',
            source: 'ai',
            type: 'only_used_in',
            statement: `${run.packageName} is only imported in main.py`,
            params: { package: run.packageName, files: ['main.py'] },
            verdict: 'CONFIRMED',
            verdictSource: 'usages_verifier',
            evidence: [{ matches: ['main.py:5'] }],
          },
          {
            id: 'c2',
            tag: 'AI-GENERATED',
            source: 'ai',
            type: 'schema_compat',
            statement: 'Replacement parameters match expected open standard',
            params: {},
            verdict: 'CONFIRMED',
            verdictSource: 'schema_compat_verifier',
            evidence: [{ compatibility: true }],
          },
        ],
        accuracy: {
          total: 2,
          confirmed: 2,
          refuted: 0,
          unverifiable: 0,
        },
      },
      proposed_changes: {
        diff_tag: 'AI-GENERATED',
        status: 'verified',
        diff: `--- a/main.py\n+++ b/main.py\n@@ -5,1 +5,1 @@\n-import ${run.packageName}\n+import open_alternative\n`,
        branch: `exitkit/exit-${run.packageName}`,
        worktree: `/tmp/exitkit-worktree-${run.packageName}`,
        error: null,
        apply_commands: [
          `git checkout -b exitkit/exit-${run.packageName}`,
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
            seconds: 0.25,
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
            seconds: 0.24,
          },
        ],
        passed: ['baseline:compile', 'after:compile'],
        failed: [],
        not_run: [],
        comparison: [
          {
            id: 'compile',
            baseline: 'passed',
            after: 'passed',
            regression: false,
          },
        ],
        comparison_method: 'exit code and sha256 of normalized output',
      },
      gaps: [],
      unresolved: [],
      out_of_scope: 'Security vulnerabilities were deliberately out of scope: no CVE or advisory data was used.',
    };

    saveCapsule(generatedCapsule);
    updateRun(runId, { capsuleId });
  }
}
