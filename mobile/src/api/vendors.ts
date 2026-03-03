import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { Vendor } from "./types";

export async function listVendors(): Promise<Vendor[]> {
  return apiGet<Vendor[]>("/api/vendors");
}

export async function getVendor(id: number): Promise<Vendor | null> {
  const res = await fetch((import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") + `/api/vendors/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createVendor(body: Omit<Vendor, "id">): Promise<Vendor> {
  return apiPost<Vendor>("/api/vendors", body);
}

export async function updateVendor(id: number, body: Partial<Vendor>): Promise<Vendor> {
  return apiPut<Vendor>(`/api/vendors/${id}`, { ...body, id });
}

export async function deleteVendor(id: number): Promise<void> {
  return apiDelete(`/api/vendors/${id}`);
}
