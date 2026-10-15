import { NextResponse } from 'next/server';
import { getRuns, createRun } from '@/lib/store';
import { executePipelineAsync } from '@/lib/runner';

export async function GET() {
  const runs = getRuns();
  return NextResponse.json({
    data: runs,
    count: runs.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.repoId || !body.packageName) {
      return NextResponse.json(
        { error: 'repoId and packageName are required fields' },
        { status: 400 }
      );
    }
    const run = createRun({
      repoId: body.repoId,
      ref: body.ref || 'main',
      packageName: body.packageName,
      model: body.model || process.env.EXITKIT_MODEL || 'qwen2.5-coder:7b',
    });

    // Run pipeline asynchronously
    executePipelineAsync(run.id).catch((err) => {
      console.error('Pipeline execution error:', err);
    });

    return NextResponse.json({ data: run }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

