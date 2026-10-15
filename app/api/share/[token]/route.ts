import { NextResponse } from 'next/server';
import { getShareLink, getCapsule } from '@/lib/store';

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const link = getShareLink(params.token);
  if (!link) {
    return NextResponse.json({ error: 'Share link invalid or expired' }, { status: 404 });
  }

  const capsule = getCapsule(link.capsuleId);
  if (!capsule) {
    return NextResponse.json({ error: 'Linked capsule not found' }, { status: 404 });
  }

  return NextResponse.json({
    data: capsule,
    shareInfo: {
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
  });
}

