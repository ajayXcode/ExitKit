import { NextResponse } from 'next/server';
import { verifyCapsule } from '@/lib/store';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const result = verifyCapsule(params.id);
  if (!result.ok && result.details === 'Capsule not found') {
    return NextResponse.json({ error: result.details }, { status: 404 });
  }
  return NextResponse.json(result);
}

