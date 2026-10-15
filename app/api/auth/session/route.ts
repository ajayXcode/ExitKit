import { NextResponse } from 'next/server';
import { currentUser, currentOrg } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    user: currentUser,
    organization: currentOrg,
    authenticated: true,
  });
}
