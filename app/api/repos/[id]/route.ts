import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const repo = getRepository(params.id);
  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }
  return NextResponse.json({ data: repo });
}

