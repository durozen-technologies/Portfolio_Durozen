import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || process.env.DOCKER_BACKEND_URL || 'http://backend:8000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathStr = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join('/') : '';
  const targetUrl = `${BACKEND_URL}/screenshots/${pathStr}`;

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

