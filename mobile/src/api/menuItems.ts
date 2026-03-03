import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { MenuItem } from "./types";

export async function listMenuItems(): Promise<MenuItem[]> {
  return apiGet<MenuItem[]>("/api/menu-items");
}

export async function listMenuItemsByVendor(vendorId: number): Promise<MenuItem[]> {
  return apiGet<MenuItem[]>(`/api/menu-items/vendor/${vendorId}`);
}

export async function getMenuItem(id: number): Promise<MenuItem | null> {
  const res = await fetch((import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") + `/api/menu-items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createMenuItem(body: Omit<MenuItem, "id">): Promise<MenuItem> {
  return apiPost<MenuItem>("/api/menu-items", body);
}

export async function updateMenuItem(id: number, body: Partial<MenuItem>): Promise<MenuItem> {
  return apiPut<MenuItem>(`/api/menu-items/${id}`, { ...body, id });
}

export async function deleteMenuItem(id: number): Promise<void> {
  return apiDelete(`/api/menu-items/${id}`);
}
