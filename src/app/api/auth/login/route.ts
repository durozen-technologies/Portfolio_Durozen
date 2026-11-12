import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateBases } from '../../backendUtils';

export const dynamic = 'force-dynamic';

async function extractCredentials(request: NextRequest): Promise<{ username: string; password: string }> {
  let username = '';
  let password = '';
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      if (body && typeof body === 'object') {
        username = String(body.username || body.user || body.email || '').trim();
        password = String(body.password || body.pass || '').trim();
      }
    } catch {
      // fallback
    }
  } else if (contentType.includes('form') || contentType.includes('urlencoded')) {
    try {
      const formData = await request.formData();
      username = String(formData.get('username') || formData.get('user') || formData.get('email') || '').trim();
      password = String(formData.get('password') || formData.get('pass') || '').trim();
    } catch {
      // fallback
    }
  }

  // Universal fallback: try parsing body text
  if (!username && !password) {
    try {
      const text = await request.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data && typeof data === 'object') {
            username = String(data.username || data.user || data.email || '').trim();
            password = String(data.password || data.pass || '').trim();
          }
        } catch {
          const params = new URLSearchParams(text);
          username = String(params.get('username') || params.get('user') || params.get('email') || '').trim();
          password = String(params.get('password') || params.get('pass') || '').trim();
        }
      }
    } catch {
      // fallback
    }
  }

  return { username, password };
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await extractCredentials(request);

    if (!username || !password) {
      return NextResponse.json(
        { detail: 'Username and password are required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({ username, password });
    const payloadBytes = new TextEncoder().encode(payload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': payloadBytes.length.toString(),
      'Accept': 'application/json',
    };

    const bases = getBackendCandidateBases();
    const candidatePaths = ['/api/auth/login'];

    let lastResponse: Response | null = null;
    let lastError: any = null;

    for (const base of bases) {
      for (const path of candidatePaths) {
        const targetUrl = `${base}${path}`;
        try {
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: payload,
            cache: 'no-store',
          });

          // If endpoint was found (success or auth error like 401/400), return immediately
          if (res.status !== 404) {
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const errorMsg = data?.detail || 'Authentication failed';
              return NextResponse.json(
                { detail: errorMsg },
                { status: res.status }
              );
            }
            return NextResponse.json(data, { status: 200 });
          }

          lastResponse = res;
        } catch (err) {
          lastError = err;
          // Continue to next candidate endpoint or base
        }
      }
    }

    if (lastResponse && lastResponse.status !== 404) {
      const data = await lastResponse.json().catch(() => null);
      return NextResponse.json(data || { detail: 'Authentication failed' }, { status: lastResponse.status });
    }

    console.error('All backend login candidate attempts failed. Last error:', lastError);
    return NextResponse.json(
      { detail: 'Authentication service temporarily unreachable. Ensure backend container is running.' },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Login proxy critical error:', error);
    return NextResponse.json(
      { detail: 'Internal authentication proxy error' },
      { status: 500 }
    );
  }
}

export const OPTIONS = async () => new NextResponse(null, { status: 204 });
