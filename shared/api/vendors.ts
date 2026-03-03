import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { VendorDto } from "./types";

export async function listVendors(): Promise<VendorDto[]> {
  return apiGet<VendorDto[]>("/api/vendors");
}

export async function getVendor(id: number): Promise<VendorDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/vendors/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createVendor(body: Omit<VendorDto, "id">): Promise<VendorDto> {
  return apiPost<VendorDto>("/api/vendors", body);
}

export async function updateVendor(id: number, body: Partial<VendorDto>): Promise<VendorDto> {
  return apiPut<VendorDto>(`/api/vendors/${id}`, { ...body, id });
}

export async function deleteVendor(id: number): Promise<void> {
  return apiDelete(`/api/vendors/${id}`);
}
