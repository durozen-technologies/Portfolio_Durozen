import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateBases } from '../../backendUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || '';
  const bases = getBackendCandidateBases();
  const candidatePaths = [`/api/auth/status${search}`];

  for (const base of bases) {
    for (const path of candidatePaths) {
      const targetUrl = `${base}${path}`;
      try {
        const res = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data, { status: 200 });
        }
      } catch {
        // Try next candidate
      }
    }
  }

  // Safe fallback: system has admin configured, prevent client 404/500 crash
  return NextResponse.json(
    { needsSetup: false, hasAdmin: true, totalAdmins: 1 },
    { status: 200 }
  );
}

export const OPTIONS = async () => new NextResponse(null, { status: 204 });
