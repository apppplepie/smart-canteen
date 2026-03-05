import { apiGet, apiPost, apiPut } from "./client";
import type { FoundItemDto } from "./types";

export async function listFoundItems(): Promise<FoundItemDto[]> {
  return apiGet<FoundItemDto[]>("/api/found-items");
}

export async function listFoundItemsByUser(userId: number): Promise<FoundItemDto[]> {
  return apiGet<FoundItemDto[]>(`/api/found-items/user/${userId}`);
}

export async function getFoundItem(id: number): Promise<FoundItemDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/found-items/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createFoundItem(body: Partial<FoundItemDto> & { title: string }): Promise<FoundItemDto> {
  return apiPost<FoundItemDto>("/api/found-items", body);
}

export async function updateFoundItem(id: number, body: Partial<FoundItemDto>): Promise<FoundItemDto> {
  return apiPut<FoundItemDto>(`/api/found-items/${id}`, { ...body, id });
}
