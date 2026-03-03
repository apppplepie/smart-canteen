import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { MenuItemDto } from "./types";

export async function listMenuItems(): Promise<MenuItemDto[]> {
  return apiGet<MenuItemDto[]>("/api/menu-items");
}

export async function listMenuItemsByVendor(vendorId: number): Promise<MenuItemDto[]> {
  return apiGet<MenuItemDto[]>(`/api/menu-items/vendor/${vendorId}`);
}

export async function getMenuItem(id: number): Promise<MenuItemDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/menu-items/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createMenuItem(body: Omit<MenuItemDto, "id">): Promise<MenuItemDto> {
  return apiPost<MenuItemDto>("/api/menu-items", body);
}

export async function updateMenuItem(id: number, body: Partial<MenuItemDto>): Promise<MenuItemDto> {
  return apiPut<MenuItemDto>(`/api/menu-items/${id}`, { ...body, id });
}

export async function deleteMenuItem(id: number): Promise<void> {
  return apiDelete(`/api/menu-items/${id}`);
}
