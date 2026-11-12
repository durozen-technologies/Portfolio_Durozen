import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

function isDocker(): boolean {
  try {
    if (fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER) {
      return true;
    }
    if (fs.existsSync('/proc/1/cgroup')) {
      const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
      if (cgroup.includes('docker') || cgroup.includes('containerd') || cgroup.includes('kubepods')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function getBackendUrl(): string {
  if (process.env.DOCKER_BACKEND_URL) {
    return process.env.DOCKER_BACKEND_URL.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  }
  const envUrl = process.env.BACKEND_URL?.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  const inContainer = isDocker();

  if (envUrl) {
    if (inContainer && (envUrl.includes('127.0.0.1') || envUrl.includes('localhost'))) {
      return 'http://backend:8000';
    }
    return envUrl;
  }

  return inContainer ? 'http://backend:8000' : 'http://localhost:8000';
}

export async function GET(request: NextRequest) {
  const backendBase = getBackendUrl();
  const search = request.nextUrl.search || '';

  // 1. Try standard /api/auth/status
  const primaryUrl = `${backendBase}/api/auth/status${search}`;
  try {
    const res = await fetch(primaryUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    }

    // 2. Fallback to /auth/status if upstream stripped /api
    if (res.status === 404) {
      const fallbackUrl = `${backendBase}/auth/status${search}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return NextResponse.json(data, { status: 200 });
      }
    }
  } catch (err) {
    console.warn(`Auth status proxy attempt failed to ${primaryUrl}:`, err);
  }

  // Safe fallback: system has admin configured, prevent client 404/500 crash
  return NextResponse.json(
    { needsSetup: false, hasAdmin: true, totalAdmins: 1 },
    { status: 200 }
  );
}

export const OPTIONS = async () => new NextResponse(null, { status: 204 });
