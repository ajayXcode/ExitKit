import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { updateRun, saveCapsule, getRepository, getRun } from './store';
import { Capsule, PipelineStep } from './models/types';

const uid = () => Math.random().toString(36).substring(2, 10);

const STEP_PROGRESS: Record<string, { step: PipelineStep; progress: number }> = {
  '1/9': { step: '1/9 scan', progress: 15 },
  '2/9': { step: '2/9 risk', progress: 30 },
  '3/9': { step: '3/9 select', progress: 40 },
  '4/9': { step: '4/9 usages', progress: 50 },
  '5/9': { step: '5/9 baseline', progress: 65 },
  '6/9': { step: '6/9 ai_analysis', progress: 75 },
  '7/9': { step: '7/9 claim_ledger', progress: 85 },
  '8/9': { step: '8/9 patch_worktree', progress: 92 },
  '9/9': { step: '9/9 capsule_ready', progress: 100 },
};

function ensureTargetRepo(repoPath: string, repoName: string, cloneUrl?: string): string {
  if (fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'))) {
    return repoPath;
  }

  // Clone from upstream repository if a clone URL is available
  if (cloneUrl) {
    const targetDir = path.join(os.tmpdir(), `exitkit-clone-${uid()}`);
    fs.mkdirSync(targetDir, { recursive: true });
    const { spawnSync } = require('node:child_process');
    const cloneRes = spawnSync('git', ['clone', '--depth', '1', cloneUrl, targetDir], {
      encoding: 'utf8',
      timeout: 120000,
    });
    if (cloneRes.status === 0 && fs.existsSync(path.join(targetDir, '.git'))) {
      return targetDir;
    }
  }

  throw new Error(`Target repository "${repoName}" is not accessible at "${repoPath}". Ensure it is cloned locally or configure a valid cloneUrl.`);
}

export async function executePipelineAsync(runId: string): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  updateRun(runId, { status: 'running' });

  const repo = getRepository(run.repoId);
  const repoName = repo ? repo.name : run.repoFullName;
  const repoCandidatePath = path.resolve(process.cwd(), repoName);

  let targetRepo: string;
  try {
    targetRepo = ensureTargetRepo(repoCandidatePath, repoName, repo?.cloneUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    updateRun(runId, { status: 'failed', error: msg });
    return;
  }

  const workDir = path.join(os.tmpdir(), `exitkit-work-${runId}`);
  fs.mkdirSync(workDir, { recursive: true });

  const binPath = path.resolve(process.cwd(), 'exitkit', 'bin', 'exitkit.js');
  const gatewayUrl = process.env.EXITKIT_BASE_URL || 'http://127.0.0.1:3000/api/gateway';

  const childEnv = {
    ...process.env,
    EXITKIT_BASE_URL: gatewayUrl,
    EXITKIT_MODEL: run.model || process.env.EXITKIT_MODEL || 'qwen2.5-coder:7b',
  };

  const args = [
    binPath,
    'run',
    targetRepo,
    '--package',
    run.packageName,
    '--work',
    workDir,
    '--out',
    workDir,
    '--json',
  ];

  await new Promise<void>((resolve) => {
    const proc = spawn(process.execPath, args, { env: childEnv });
    let stdoutData = '';

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      const line = chunk.toString().trim();
      const currentRun = getRun(runId);
      if (currentRun && line) {
        currentRun.logs.push(line);
        for (const [key, val] of Object.entries(STEP_PROGRESS)) {
          if (line.includes(key)) {
            updateRun(runId, {
              currentStep: val.step,
              progressPercent: val.progress,
            });
            break;
          }
        }
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const capsuleFile = path.join(workDir, 'capsule.json');
          if (fs.existsSync(capsuleFile)) {
            const raw = JSON.parse(fs.readFileSync(capsuleFile, 'utf8'));
            const capsuleId = `cap_${uid()}`;
            const capsule: Capsule = {
              id: capsuleId,
              runId: run.id,
              repoId: run.repoId,
              ...raw,
            };
            saveCapsule(capsule);
            updateRun(runId, {
              status: 'completed',
              completedAt: new Date().toISOString(),
              currentStep: '9/9 capsule_ready',
              progressPercent: 100,
              capsuleId,
            });
            return resolve();
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          updateRun(runId, { status: 'failed', error: `Capsule parsing error: ${msg}` });
          return resolve();
        }
      }

      updateRun(runId, {
        status: 'failed',
        error: `CLI pipeline exited with code ${code}`,
      });
      resolve();
    });

    proc.on('error', (err) => {
      updateRun(runId, {
        status: 'failed',
        error: `Failed to spawn CLI pipeline: ${err.message}`,
      });
      resolve();
    });
  });
}
