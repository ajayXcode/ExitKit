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

  // Simulates scanning dependencies
  repo.lastScannedAt = new Date().toISOString();
  return NextResponse.json({
    message: 'Scan completed',
    repoId: repo.id,
    dependenciesCount: repo.dependencies.length,
    dependencies: repo.dependencies,
  });
}
