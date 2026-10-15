import { NextResponse } from 'next/server';
import { createShareLink, getCapsule } from '@/lib/store';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const capsule = getCapsule(params.id);
  if (!capsule) {
    return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
  }

  const link = createShareLink(params.id);
  const host = req.headers.get('host') || 'exitkitt.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const shareUrl = `${protocol}://${host}/share/${link.token}`;

  return NextResponse.json({
    data: link,
    shareUrl,
  });
}
