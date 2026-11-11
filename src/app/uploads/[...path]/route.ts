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

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathStr = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join('/') : '';
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/uploads/${pathStr}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse('File not found', { status: res.status });
    }
    const headers = new Headers(res.headers);
    return new NextResponse(res.body, { status: 200, headers });
  } catch (err) {
    return new NextResponse('File not found', { status: 404 });
  }
}


