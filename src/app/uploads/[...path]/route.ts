import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendUrl(): string {
  const envUrl = process.env.BACKEND_URL || process.env.DOCKER_BACKEND_URL;
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://backend:8000';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const pathString = Array.isArray(path) ? path.join('/') : '';
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/uploads/${pathString}`;

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
