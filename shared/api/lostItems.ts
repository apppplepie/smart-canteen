import { apiGet, apiPost, apiPut } from "./client";
import type { LostItemDto } from "./types";

export async function listLostItems(): Promise<LostItemDto[]> {
  return apiGet<LostItemDto[]>("/api/lost-items");
}

export async function listLostItemsByUser(userId: number): Promise<LostItemDto[]> {
  return apiGet<LostItemDto[]>(`/api/lost-items/user/${userId}`);
}

export async function getLostItem(id: number): Promise<LostItemDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/lost-items/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createLostItem(body: Partial<LostItemDto> & { itemName: string }): Promise<LostItemDto> {
  return apiPost<LostItemDto>("/api/lost-items", body);
}

export async function updateLostItem(id: number, body: Partial<LostItemDto>): Promise<LostItemDto> {
  return apiPut<LostItemDto>(`/api/lost-items/${id}`, { ...body, id });
}
