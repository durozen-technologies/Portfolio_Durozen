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

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathStr = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join('/') : '';
  const search = request.nextUrl.search || '';
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/api/${pathStr}${search}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('content-length');

  try {
    let body: any = undefined;
    const contentType = request.headers.get('content-type') || '';

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType.includes('application/json') || contentType.includes('application/x-www-form-urlencoded')) {
        body = await request.text();
      } else {
        body = await request.arrayBuffer();
      }
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
      // @ts-ignore
      duplex: 'half',
      cache: 'no-store',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`API Proxy error forwarding to ${targetUrl}:`, error);
    return NextResponse.json(
      { detail: `Could not reach backend service at ${targetUrl}. Ensure backend container is running.` },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;

