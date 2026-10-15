import path from 'node:path';
import { writeJSON, readJSON, exists } from './util.js';
import fs from 'node:fs';
import { scanRepo } from './scan.js';
import { scoreRisk } from './risk.js';
import { findUsages } from './usages.js';
import { runChecks } from './checks.js';
import { analyze } from './analyze.js';
import { runLedger } from './verifiers.js';
import { applyPatch } from './patch.js';
import { buildCapsule } from './capsule.js';
import { verifyCapsule } from './verify.js';

export { scanRepo, scoreRisk, findUsages, runChecks, analyze, runLedger, applyPatch, buildCapsule, verifyCapsule };

export async function runPipeline(repoArg, flags = {}, log = () => {}) {
  const repo = path.resolve(repoArg);
  const work = path.resolve(flags.work || '.exitkit');
  fs.mkdirSync(work, { recursive: true });
  const w = (n) => path.join(work, n);

  log('1/9 scan');
  const scan = scanRepo(repo); writeJSON(w('deps.json'), scan);
  if (!scan.dependencies.length) throw new Error('no dependencies found (looked for requirements*.txt and package.json)');
  log('2/9 risk');
  const risk = await scoreRisk(repo, scan, { online: !!flags.online }); writeJSON(w('risk.json'), risk);
  const target = flags.package
    ? scan.dependencies.find((d) => d.name.toLowerCase() === flags.package.toLowerCase())
    : scan.dependencies.find((d) => d.name === risk.dependencies[0].name);
  if (!target) throw new Error(`dependency "${flags.package}" not found in manifests`);
  log(`3/9 select: ${target.name}`);
  log('4/9 usages');
  const usages = findUsages(repo, target.name, target.ecosystem); writeJSON(w('usages.json'), usages);
  writeJSON(w('meta.json'), { repo, package: target.name, ecosystem: target.ecosystem });
  const copts = { install: !!flags.install, cmd: flags.cmd || [] };
  log('5/9 baseline checks');
  writeJSON(w('baseline.json'), runChecks(repo, copts));
  log('6/9 AI analysis');
  const ai = await analyze(repo, target.name, usages, flags); writeJSON(w('claims.json'), ai);
  fs.writeFileSync(w('patch.diff'), ai.diff || '');
  log('7/9 claim ledger');
  writeJSON(w('ledger.json'), runLedger(ai.claims, { repo, usages }));
  log('8/9 patch in worktree + after checks');
  const patch = applyPatch(repo, w('patch.diff'), { pkg: target.name, worktree: flags.worktree }); writeJSON(w('patch.json'), patch);
  writeJSON(w('after.json'), patch.status === 'applied' ? runChecks(patch.worktree, copts) : { path: null, checks: [] });
  log('9/9 capsule');
  return buildCapsule(work, { out: path.resolve(flags.out || work) });
}
