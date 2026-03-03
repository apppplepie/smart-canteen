/**
 * 后端 API 请求客户端。baseURL 来自 VITE_API_BASE_URL，未配置时请求会失败，由各 hook 回退到 mock。
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url && typeof url === 'string') return url.replace(/\/$/, '');
  return '';
};

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

export function isApiConfigured(): boolean {
  return !!getBaseUrl();
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('VITE_API_BASE_URL not configured');
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('VITE_API_BASE_URL not configured');
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('VITE_API_BASE_URL not configured');
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const base = getBaseUrl();
  if (!base) throw new Error('VITE_API_BASE_URL not configured');
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`API ${res.status}: ${res.statusText}`);
}
