import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'exitkit-cloud',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      api: 'healthy',
      store: 'healthy',
      runner: 'ready',
    },
  });
}

