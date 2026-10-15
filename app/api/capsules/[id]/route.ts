import { NextResponse } from 'next/server';
import { getCapsule } from '@/lib/store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const capsule = getCapsule(params.id);
  if (!capsule) {
    return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
  }
  return NextResponse.json({ data: capsule });
}
