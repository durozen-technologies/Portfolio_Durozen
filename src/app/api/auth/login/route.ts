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

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();

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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': payloadBytes.length.toString(),
      'Accept': 'application/json',
    };

    // 1. Try standard /api/auth/login
    const primaryUrl = `${backendBase}/api/auth/login`;
    let res = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: payload,
      cache: 'no-store',
    });

    // 2. Fallback to /auth/login if backend route or proxy stripped /api
    if (res.status === 404) {
      const fallbackUrl = `${backendBase}/auth/login`;
      res = await fetch(fallbackUrl, {
        method: 'POST',
        headers,
        body: payload,
        cache: 'no-store',
      });
    }

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
      { detail: 'Authentication service temporarily unreachable. Ensure backend container is running.' },
      { status: 502 }
    );
  }
}

export const OPTIONS = async () => new NextResponse(null, { status: 204 });
