import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedBackendBase } from '../../backendUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || '';
  const base = await getVerifiedBackendBase();

  if (base) {
    try {
      const res = await fetch(`${base}/api/auth/status${search}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 200 });
      }
    } catch {
      // fall through to the safe default below
    }
  }

  // Safe fallback: system has admin configured, prevent client 404/500 crash
  return NextResponse.json(
    { needsSetup: false, hasAdmin: true, totalAdmins: 1 },
    { status: 200 }
  );
}

export const OPTIONS = async () => new NextResponse(null, { status: 204 });
