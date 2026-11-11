import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || process.env.DOCKER_BACKEND_URL || 'http://backend:8000';

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathStr = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join('/') : '';
  const search = request.nextUrl.search || '';
  const targetUrl = `${BACKEND_URL}/api/${pathStr}${search}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');

  try {
    let body: ArrayBuffer | undefined = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
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
      { detail: 'Could not reach backend service. Ensure backend container is running.' },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
