import fs from 'fs';

export function isDocker(): boolean {
  try {
    if (fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER) {
      return true;
    }
    if (fs.existsSync('/proc/1/cgroup')) {
      const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
      if (
        cgroup.includes('docker') ||
        cgroup.includes('containerd') ||
        cgroup.includes('kubepods') ||
        cgroup.includes('libpod')
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function cleanBackendBaseUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Strip trailing slashes and common API suffixes so path concatenation is deterministic
  return trimmed
    .replace(/\/+$/, '')
    .replace(/\/api(\/v1)?\/?$/, '')
    .replace(/\/v1\/?$/, '');
}

export function getBackendCandidateBases(): string[] {
  const candidates: string[] = [];

  const add = (raw: string | undefined | null) => {
    const cleaned = cleanBackendBaseUrl(raw);
    if (cleaned && !candidates.includes(cleaned)) {
      candidates.push(cleaned);
    }
  };

  // 1. Explicit environment configurations (prioritize BACKEND_URL over baked DOCKER_BACKEND_URL)
  add(process.env.BACKEND_URL);
  add(process.env.DOCKER_BACKEND_URL);
  add(process.env.INTERNAL_BACKEND_URL);

  // 2. Network candidates based on environment
  if (isDocker()) {
    add('http://durozen-backend:8000');
    add('http://backend:8000');
    add('http://127.0.0.1:8000');
    add('http://localhost:8000');
  } else {
    add('http://127.0.0.1:8000');
    add('http://localhost:8000');
    add('http://durozen-backend:8000');
    add('http://backend:8000');
  }

  return candidates;
}

export function getPrimaryBackendUrl(): string {
  const candidates = getBackendCandidateBases();
  return candidates[0] || (isDocker() ? 'http://durozen-backend:8000' : 'http://localhost:8000');
}

let verifiedBackendBase: string | null = null;

export function invalidateVerifiedBackendBase(): void {
  verifiedBackendBase = null;
}

async function isDurozenBackend(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return typeof data?.service === 'string' && data.service.includes('DUROZEN');
  } catch {
    return false;
  }
}

/**
 * Returns the first candidate that identifies itself as the DUROZEN API.
 * The health check prevents requests (including admin credentials) from being
 * sent to another stack that shares the Docker network under a generic alias.
 */
export async function getVerifiedBackendBase(): Promise<string | null> {
  if (verifiedBackendBase) return verifiedBackendBase;

  const candidates = getBackendCandidateBases();
  for (const base of candidates) {
    if (await isDurozenBackend(base)) {
      verifiedBackendBase = base;
      return base;
    }
  }

  // Fallback to primary candidate if verification times out to prevent service failure
  const primary = candidates[0] || (isDocker() ? 'http://durozen-backend:8000' : 'http://localhost:8000');
  return primary;
}
