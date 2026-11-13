import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedBackendBase } from '../backendUtils';

export const dynamic = 'force-dynamic';

async function proxyRequest(
  request: NextRequest,
  context: { params?: Promise<{ path?: string[] }> }
) {
  // Determine relative API path
  let pathString = '';
  if (context?.params) {
    try {
      const resolved = await context.params;
      if (Array.isArray(resolved?.path)) {
        pathString = resolved.path.join('/');
      }
    } catch {
      // fallback to pathname parsing
    }
  }

  // Robust fallback: parse from nextUrl pathname
  if (!pathString) {
    const rawPath = request.nextUrl.pathname;
    pathString = rawPath.replace(/^\/?api\/?/, '');
  }

  // Clean path to prevent duplicate /api or extra slashes
  const cleanPath = pathString.replace(/^\/+|\/+$/g, '').replace(/^api\/?/, '');
  const search = request.nextUrl.search || '';

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

  const base = await getVerifiedBackendBase();
  if (!base) {
    return NextResponse.json(
      { detail: 'Portfolio backend not reachable. Check that the backend container is running.' },
      { status: 502 }
    );
  }

  const targetUrl = `${base}/api/${cleanPath}${search}`;

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
  } catch (err) {
    console.error(`API proxy error forwarding to ${targetUrl}:`, err);
    return NextResponse.json(
      { detail: `Could not reach backend service at ${targetUrl}.` },
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
