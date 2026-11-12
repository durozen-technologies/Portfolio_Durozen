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
    let response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
      cache: 'no-store',
    });

    // If backend returned 404, try direct root endpoint without /api prefix
    if (response.status === 404 && pathString) {
      const rootUrl = `${backendBase}/${pathString}${search}`;
      try {
        const fallbackResponse = await fetch(rootUrl, {
          method: request.method,
          headers: requestHeaders,
          body,
          cache: 'no-store',
        });
        if (fallbackResponse.status !== 404) {
          response = fallbackResponse;
        }
      } catch {
        // preserve original response
      }
    }

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
