import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendUrl(): string {
  if (process.env.DOCKER_BACKEND_URL) {
    return process.env.DOCKER_BACKEND_URL.replace(/\/+$/, '');
  }
  const envUrl = process.env.BACKEND_URL?.replace(/\/+$/, '');
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl;
  }
  return 'http://backend:8000';
}

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/api/auth/login`;

  try {
    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json(
        { detail: 'Username and password are required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({ username, password });
    const payloadBytes = new TextEncoder().encode(payload);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payloadBytes.length.toString(),
      },
      body: payload,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.detail || 'Authentication failed';
      return NextResponse.json(
        { detail: errorMsg },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { detail: 'Authentication service temporarily unreachable' },
      { status: 502 }
    );
  }
}
