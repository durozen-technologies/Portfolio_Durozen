import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendUrl(): string {
  const envUrl = process.env.BACKEND_URL || process.env.DOCKER_BACKEND_URL;
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://backend:8000';
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const pathString = Array.isArray(path) ? path.join('/') : '';
  const search = request.nextUrl.search || '';
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/api/${pathString}${search}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');

  let body: BodyInit | undefined = undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const rawBuffer = await request.arrayBuffer();
    if (rawBuffer.byteLength > 0) {
      body = rawBuffer;
      requestHeaders.set('content-length', rawBuffer.byteLength.toString());
    } else {
      requestHeaders.delete('content-length');
    }
  } else {
    requestHeaders.delete('content-length');
    requestHeaders.delete('content-type');
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    const responseData = await response.arrayBuffer();

    return new NextResponse(responseData, {
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
