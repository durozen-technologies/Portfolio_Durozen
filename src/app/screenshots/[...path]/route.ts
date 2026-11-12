import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ path?: string[] }> }
) {
  let pathString = '';
  if (context?.params) {
    try {
      const resolved = await context.params;
      if (Array.isArray(resolved?.path)) {
        pathString = resolved.path.join('/');
      }
    } catch {
      // fallback
    }
  }

  if (!pathString) {
    pathString = request.nextUrl.pathname.replace(/^\/?screenshots\/?/, '');
  }

  const search = request.nextUrl.search || '';
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/screenshots/${pathString}${search}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse('File not found', { status: res.status });
    }
    const headers = new Headers(res.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.delete('transfer-encoding');
    const data = await res.arrayBuffer();
    return new NextResponse(data, { status: 200, headers });
  } catch (err) {
    return new NextResponse('File not found', { status: 404 });
  }
}
