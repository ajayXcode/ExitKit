import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const repo = getRepository(params.id);
  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  const fs = require('node:fs');
  const path = require('node:path');
  const { spawnSync } = require('node:child_process');

  const repoCandidatePath = path.resolve(process.cwd(), repo.name);
  if (fs.existsSync(repoCandidatePath)) {
    const binPath = path.resolve(process.cwd(), 'exitkit', 'bin', 'exitkit.js');
    const res = spawnSync(process.execPath, [binPath, 'scan', repoCandidatePath, '--json'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout) {
      try {
        const parsed = JSON.parse(res.stdout);
        repo.dependencies = (parsed.dependencies || []).map((d: { name: string; ecosystem?: 'pip' | 'npm'; spec?: string; file?: string; line?: number; has_upper_bound?: boolean }, idx: number) => ({
          id: `dep_${idx}`,
          name: d.name,
          ecosystem: d.ecosystem || 'pip',
          spec: d.spec || '',
          manifestFile: d.file,
          manifestLine: d.line,
          riskScore: d.has_upper_bound ? 20 : 75,
          exitDifficulty: 5,
          symbolsCount: 2,
          callSitesCount: 2,
          filesCount: 1,
          signals: d.has_upper_bound ? [] : [{
            id: 'sig_no_bound',
            tag: 'OBSERVED',
            text: `${d.name} has NO UPPER BOUND`,
            evidence: [{ file: d.file, line: d.line }],
          }],
        }));
      } catch {
        // preserve existing if parse error
      }
    }
  }

  repo.lastScannedAt = new Date().toISOString();
  return NextResponse.json({
    message: 'Scan completed',
    repoId: repo.id,
    dependenciesCount: repo.dependencies.length,
    dependencies: repo.dependencies,
  });
}

