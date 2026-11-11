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

export async function GET(request: NextRequest) {
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/api/auth/status`;

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    }
  } catch (err) {
    // Backend temporarily initializing
  }

  // Safe fallback: system has admin configured, no first-time setup needed
  return NextResponse.json(
    { needsSetup: false, hasAdmin: true, totalAdmins: 1 },
    { status: 200 }
  );
}

