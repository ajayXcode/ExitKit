import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/store';

export async function POST() {
  return NextResponse.json({
    message: 'Authenticated successfully via GitHub OAuth',
    user: currentUser,
  });
}
