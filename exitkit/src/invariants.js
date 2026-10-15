import { scanRepo } from './scan.js';
import { findUsages } from './usages.js';

/**
 * Checks the hard exit invariants according to Master Document Section I3:
 * 1. Target dependency is eliminated from manifests (requirements.txt / package.json)
 * 2. No import or call site of target dependency remains in codebase
 * 3. After-checks do not regress compared to baseline
 */
export function checkExitInvariants(worktree, pkg, ecosystem = 'pip', comparison = []) {
  const invariants = [];

  // Invariant 1: Dependency manifest removal
  try {
    const scan = scanRepo(worktree);
    const stillInManifest = scan.dependencies.some(
      (d) => d.name.toLowerCase() === pkg.toLowerCase()
    );
    invariants.push({
      id: 'manifest_removed',
      statement: `Dependency "${pkg}" is removed from manifests`,
      pass: !stillInManifest,
      details: stillInManifest
        ? `Dependency "${pkg}" is still declared in worktree manifests`
        : 'Confirmed: removed from manifests',
    });
  } catch (err) {
    invariants.push({
      id: 'manifest_removed',
      statement: `Dependency "${pkg}" is removed from manifests`,
      pass: false,
      details: `Failed to scan worktree manifests: ${err.message}`,
    });
  }

  // Invariant 2: Code usage elimination
  try {
    const usages = findUsages(worktree, pkg, ecosystem);
    const usagesCount = usages.usages.length;
    invariants.push({
      id: 'usages_eliminated',
      statement: `No import or call sites of "${pkg}" remain in codebase`,
      pass: usagesCount === 0,
      details: usagesCount === 0
        ? 'Confirmed: zero usages remain'
        : `${usagesCount} usage(s) still found in code: ${usages.usages.map((u) => `${u.file}:${u.line}`).join(', ')}`,
    });
  } catch (err) {
    invariants.push({
      id: 'usages_eliminated',
      statement: `No import or call sites of "${pkg}" remain in codebase`,
      pass: false,
      details: `Failed to inspect worktree usages: ${err.message}`,
    });
  }

  // Invariant 3: Check regressions
  const regressed = (comparison || []).filter((c) => c.regression);
  invariants.push({
    id: 'no_check_regressions',
    statement: 'After-checks do not regress compared to baseline',
    pass: regressed.length === 0,
    details: regressed.length === 0
      ? 'Confirmed: no regressions detected'
      : `Regressions detected in: ${regressed.map((r) => r.id).join(', ')}`,
  });

  const allPassed = invariants.every((inv) => inv.pass);
  return {
    ok: allPassed,
    invariants,
    passed_count: invariants.filter((i) => i.pass).length,
    total_count: invariants.length,
  };
}
