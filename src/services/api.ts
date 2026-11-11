import { LIVE_PROJECTS, ProjectItem } from '../data/projects';

const API_BASE_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || (typeof process !== 'undefined' && process.env.VITE_API_BASE_URL) || 'http://localhost:8000';
const TOKEN_KEY = 'durozen_admin_token';
const USER_KEY = 'durozen_admin_user';

export interface ApiProjectItem extends ProjectItem {
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  databaseConnected: boolean;
  databaseType: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public getAdminUser(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(USER_KEY);
    }
    return null;
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  private async fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const baseOverride = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || (typeof process !== 'undefined' && process.env.VITE_API_BASE_URL);
    const candidates = baseOverride 
      ? [`${baseOverride}${endpoint}`]
      : [
          endpoint, // 1. Via Next.js dev server rewrites proxy
          `http://localhost:8000${endpoint}`, // 2. Direct localhost:8000
          `http://127.0.0.1:8000${endpoint}`, // 3. Direct 127.0.0.1:8000
        ];

    let lastError: any = null;
    for (const url of candidates) {
      try {
        const response = await fetch(url, options);
        // If we get an actual HTTP response (even 4xx/5xx from API), return it
        return response;
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error('FastAPI backend is offline. Please make sure the backend is running on port 8000 (run: npm run backend)');
  }

  // Health check to test backend and DB status
  public async checkHealth(): Promise<HealthResponse | null> {
    try {
      const response = await this.fetchWithFallback('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  // Check if system requires first-time admin setup
  public async getAuthStatus(): Promise<{ needsSetup: boolean; hasAdmin: boolean; totalAdmins: number }> {
    try {
      const response = await this.fetchWithFallback('/api/auth/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        return await response.json();
      }
      return { needsSetup: false, hasAdmin: true, totalAdmins: 1 };
    } catch {
      return { needsSetup: false, hasAdmin: true, totalAdmins: 1 };
    }
  }

  // Setup first administrator account (when no user exists)
  public async setupFirstAdmin(username: string, password: string): Promise<LoginResponse> {
    const response = await this.fetchWithFallback('/api/auth/setup-first-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to create administrator' }));
      const msg = typeof err?.detail === 'string' 
        ? err.detail 
        : Array.isArray(err?.detail) 
          ? err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') 
          : 'Setup failed';
      throw new Error(msg);
    }

    const data: LoginResponse = await response.json();
    this.token = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, data.username);
    }
    return data;
  }

  // Login
  public async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.fetchWithFallback('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Login failed' }));
      const msg = typeof err?.detail === 'string' 
        ? err.detail 
        : Array.isArray(err?.detail) 
          ? err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') 
          : 'Authentication failed';
      throw new Error(msg);
    }

    const data: LoginResponse = await response.json();
    this.token = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, data.username);
    }
    return data;
  }

  // Logout
  public logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  // Create New Admin Account
  public async createAdmin(username: string, password: string): Promise<{ success: boolean; message: string; username: string }> {
    const response = await this.fetchWithFallback('/api/auth/register-admin', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to create admin' }));
      throw new Error(err.detail || 'Failed to create admin account');
    }

    return await response.json();
  }

  // Helper to merge local overrides
  private applyLocalOverrides(list: ApiProjectItem[]): ApiProjectItem[] {
    try {
      if (typeof window === 'undefined') return list;
      const overridesStr = localStorage.getItem('durozen_project_overrides');
      if (!overridesStr) return list;
      const overrides = JSON.parse(overridesStr);
      return list.map(item => overrides[item.id] ? { ...item, ...overrides[item.id] } : item);
    } catch {
      return list;
    }
  }

  // Fetch all projects (with automatic fallback to LIVE_PROJECTS and local cache)
  public async getProjects(category?: string, includeInactive: boolean = false): Promise<ApiProjectItem[]> {
    try {
      const queryParams = new URLSearchParams();
      if (category && category !== 'All') {
        queryParams.append('category', category);
      }
      if (includeInactive) {
        queryParams.append('include_inactive', 'true');
      }
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const response = await this.fetchWithFallback(`/api/projects${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return this.applyLocalOverrides(data);
        }
      }
    } catch (err) {
      console.warn('FastAPI backend not reachable, using local projects fallback:', err);
    }

    // Fallback to static live projects if server is offline or empty
    const baseList = (category && category !== 'All')
      ? LIVE_PROJECTS.filter(p => p.category === category)
      : LIVE_PROJECTS;
    return this.applyLocalOverrides(baseList);
  }

  // Create Project
  public async createProject(project: Partial<ApiProjectItem>): Promise<ApiProjectItem> {
    const response = await this.fetchWithFallback('/api/projects', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(project)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to create demo site' }));
      throw new Error(err.detail || 'Failed to create demo site');
    }

    const created: ApiProjectItem = await response.json();
    try {
      if (typeof window !== 'undefined') {
        const overridesStr = localStorage.getItem('durozen_project_overrides');
        const overrides = overridesStr ? JSON.parse(overridesStr) : {};
        overrides[created.id] = { ...created, ...project };
        localStorage.setItem('durozen_project_overrides', JSON.stringify(overrides));
      }
    } catch {}

    return created;
  }

  // Update Project
  public async updateProject(id: string, project: Partial<ApiProjectItem>): Promise<ApiProjectItem> {
    const response = await this.fetchWithFallback(`/api/projects/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(project)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to update demo site' }));
      throw new Error(err.detail || 'Failed to update demo site');
    }

    const updated: ApiProjectItem = await response.json();
    try {
      if (typeof window !== 'undefined') {
        const overridesStr = localStorage.getItem('durozen_project_overrides');
        const overrides = overridesStr ? JSON.parse(overridesStr) : {};
        overrides[id] = { ...updated, ...project };
        localStorage.setItem('durozen_project_overrides', JSON.stringify(overrides));
      }
    } catch {}

    return updated;
  }

  // Delete Project
  public async deleteProject(id: string): Promise<boolean> {
    const response = await this.fetchWithFallback(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to delete demo site' }));
      throw new Error(err.detail || 'Failed to delete demo site');
    }

    try {
      if (typeof window !== 'undefined') {
        const overridesStr = localStorage.getItem('durozen_project_overrides');
        if (overridesStr) {
          const overrides = JSON.parse(overridesStr);
          delete overrides[id];
          localStorage.setItem('durozen_project_overrides', JSON.stringify(overrides));
        }
      }
    } catch {}

    return true;
  }

  // Upload website front look picture
  public async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const baseOverride = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || (typeof process !== 'undefined' && process.env.VITE_API_BASE_URL);
    const candidates = baseOverride
      ? [`${baseOverride}/api/upload`]
      : [
          '/api/upload',
          'http://localhost:8000/api/upload',
          'http://127.0.0.1:8000/api/upload'
        ];

    let lastError: any = null;
    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
        if (response.ok) {
          const data = await response.json();
          return data.url;
        }
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Failed to upload image to backend');
  }

  // Seed default projects
  public async seedProjects(force: boolean = false): Promise<{ message: string; totalCount: number }> {
    const response = await this.fetchWithFallback(`/api/projects/seed?force=${force}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to seed projects' }));
      throw new Error(err.detail || 'Failed to seed projects');
    }

    return await response.json();
  }
}

export const api = new ApiService();

