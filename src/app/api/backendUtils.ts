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
    add('http://backend:8000');
    add('http://durozen-backend:8000');
    add('http://127.0.0.1:8000');
    add('http://localhost:8000');
  } else {
    add('http://127.0.0.1:8000');
    add('http://localhost:8000');
    add('http://backend:8000');
    add('http://durozen-backend:8000');
  }

  return candidates;
}

export function getPrimaryBackendUrl(): string {
  const candidates = getBackendCandidateBases();
  return candidates[0] || (isDocker() ? 'http://backend:8000' : 'http://localhost:8000');
}
