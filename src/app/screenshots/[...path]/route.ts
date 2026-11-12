import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isDocker(): boolean {
  try {
    return fs.existsSync('/.dockerenv') || Boolean(process.env.DOCKER_CONTAINER);
  } catch {
    return false;
  }
}

function getBackendUrl(): string {
  if (process.env.DOCKER_BACKEND_URL) {
    return process.env.DOCKER_BACKEND_URL.replace(/\/+$/, '');
  }
  const envUrl = process.env.BACKEND_URL?.replace(/\/+$/, '');
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
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const pathString = Array.isArray(path) ? path.join('/') : '';
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/screenshots/${pathString}`;

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
