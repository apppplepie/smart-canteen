import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { QueueEntryDto } from "./types";

export async function listQueueEntries(): Promise<QueueEntryDto[]> {
  return apiGet<QueueEntryDto[]>("/api/queue-entries");
}

export async function listQueueEntriesByVendor(vendorId: number): Promise<QueueEntryDto[]> {
  return apiGet<QueueEntryDto[]>(`/api/queue-entries/vendor/${vendorId}`);
}

export async function getQueueEntry(id: number): Promise<QueueEntryDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/queue-entries/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createQueueEntry(body: Partial<QueueEntryDto> & { vendorId: number; queueNumber: string }): Promise<QueueEntryDto> {
  return apiPost<QueueEntryDto>("/api/queue-entries", body);
}

export async function updateQueueEntry(id: number, body: Partial<QueueEntryDto>): Promise<QueueEntryDto> {
  return apiPut<QueueEntryDto>(`/api/queue-entries/${id}`, { ...body, id });
}

export async function deleteQueueEntry(id: number): Promise<void> {
  return apiDelete(`/api/queue-entries/${id}`);
}
