/**
 * 共享 API 客户端：baseURL 来自 VITE_API_BASE_URL。
 * 构建时设 VITE_API_SAME_ORIGIN=true 且留空 VITE_API_BASE_URL 时，请求走当前站点 /api/（由 Nginx 反代后端）。
 */

function sameOriginApi(): boolean {
  return typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_SAME_ORIGIN === "true";
}

function getBaseUrl(): string {
  const url = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_API_BASE_URL : "";
  return typeof url === "string" ? url.replace(/\/$/, "") : "";
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

export function isApiConfigured(): boolean {
  return !!getBaseUrl() || sameOriginApi();
}

function resolveFetchUrl(path: string): string {
  const base = getBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base) return `${base}${p}`;
  if (sameOriginApi()) return p;
  throw new Error("VITE_API_BASE_URL not configured");
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
  const res = await fetch(resolveFetchUrl(path), {
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
  const res = await fetch(resolveFetchUrl(path), {
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
  const res = await fetch(resolveFetchUrl(path), {
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
  const res = await fetch(resolveFetchUrl(path), { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => res.statusText);
    throw new ApiError(body || res.statusText, res.status, body);
  }
}
