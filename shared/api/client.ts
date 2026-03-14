/**
 * 共享 API 客户端：baseURL 来自 VITE_API_BASE_URL。
 * 未配置时 getBaseUrl() 返回 ''，isApiConfigured() 为 false，apiGet/apiPost 等会抛错，便于各端回退 mock。
 */

function getBaseUrl(): string {
  const url = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_API_BASE_URL : "";
  return typeof url === "string" ? url.replace(/\/$/, "") : "";
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

export function isApiConfigured(): boolean {
  return !!getBaseUrl();
}

function ensureBase(): string {
  const base = getBaseUrl();
  if (!base) throw new Error("VITE_API_BASE_URL not configured");
  return base;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message || `HTTP ${status}`);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = ensureBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new ApiError(body || res.statusText, res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = ensureBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new ApiError(body || res.statusText, res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const base = ensureBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new ApiError(body || res.statusText, res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const base = ensureBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => res.statusText);
    throw new ApiError(body || res.statusText, res.status, body);
  }
}
