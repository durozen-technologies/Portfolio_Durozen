import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedBackendBase } from '../../backendUtils';

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

    const base = await getVerifiedBackendBase();
    if (!base) {
      console.error('No verified DUROZEN backend found among internal candidates.');
      return NextResponse.json(
        { detail: 'Authentication service unavailable: portfolio backend not reachable.' },
        { status: 502 }
      );
    }

    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers,
      body: payload,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { detail: data?.detail || 'Authentication failed' },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Login proxy critical error:', error);
    return NextResponse.json(
      { detail: 'Internal authentication proxy error' },
      { status: 500 }
    );
  }
}

export const OPTIONS = async () => new NextResponse(null, { status: 204 });
