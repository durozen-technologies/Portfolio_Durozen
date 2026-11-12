import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateBases } from '../../api/backendUtils';

export const dynamic = 'force-dynamic';

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
    pathString = request.nextUrl.pathname.replace(/^\/?uploads\/?/, '');
  }

  const cleanPath = pathString.replace(/^\/+/, '');
  const search = request.nextUrl.search || '';
  const bases = getBackendCandidateBases();

  for (const base of bases) {
    const targetUrl = `${base}/uploads/${cleanPath}${search}`;
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const headers = new Headers(res.headers);
        headers.delete('content-encoding');
        headers.delete('content-length');
        headers.delete('transfer-encoding');
        const data = await res.arrayBuffer();
        return new NextResponse(data, { status: 200, headers });
      }
    } catch {
      // Try next candidate base
    }
  }

  return new NextResponse('File not found', { status: 404 });
}
