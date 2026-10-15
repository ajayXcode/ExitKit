import { NextResponse } from 'next/server';
import { getRepositories, addRepository } from '@/lib/store';

export async function GET() {
  const repos = getRepositories();
  return NextResponse.json({
    data: repos,
    count: repos.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.fullName && !body.name) {
      return NextResponse.json({ error: 'fullName or name is required' }, { status: 400 });
    }
    const newRepo = addRepository(body);
    return NextResponse.json({ data: newRepo }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
