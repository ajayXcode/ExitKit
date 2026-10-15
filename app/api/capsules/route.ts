import { NextResponse } from 'next/server';
import { getCapsules, saveCapsule } from '@/lib/store';

export async function GET() {
  const capsules = getCapsules();
  return NextResponse.json({
    data: capsules,
    count: capsules.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.id || !body.dependency) {
      return NextResponse.json({ error: 'Valid capsule object required' }, { status: 400 });
    }
    const saved = saveCapsule(body);
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
