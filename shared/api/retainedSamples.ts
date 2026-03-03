import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { RetainedSampleDto } from "./types";

export async function listRetainedSamples(): Promise<RetainedSampleDto[]> {
  return apiGet<RetainedSampleDto[]>("/api/retained-samples");
}

export async function listRetainedSamplesByVendor(vendorId: number): Promise<RetainedSampleDto[]> {
  return apiGet<RetainedSampleDto[]>(`/api/retained-samples/vendor/${vendorId}`);
}

export async function getRetainedSample(id: number): Promise<RetainedSampleDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/retained-samples/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createRetainedSample(body: Omit<RetainedSampleDto, "id">): Promise<RetainedSampleDto> {
  return apiPost<RetainedSampleDto>("/api/retained-samples", body);
}

export async function updateRetainedSample(id: number, body: Partial<RetainedSampleDto>): Promise<RetainedSampleDto> {
  return apiPut<RetainedSampleDto>(`/api/retained-samples/${id}`, { ...body, id });
}

export async function deleteRetainedSample(id: number): Promise<void> {
  return apiDelete(`/api/retained-samples/${id}`);
}
