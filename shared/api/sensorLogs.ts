import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { SensorLogDto } from "./types";

export async function listSensorLogs(): Promise<SensorLogDto[]> {
  return apiGet<SensorLogDto[]>("/api/sensor-logs");
}

export async function getSensorLog(id: number): Promise<SensorLogDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/sensor-logs/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createSensorLog(body: Omit<SensorLogDto, "id">): Promise<SensorLogDto> {
  return apiPost<SensorLogDto>("/api/sensor-logs", body);
}

export async function updateSensorLog(id: number, body: Partial<SensorLogDto>): Promise<SensorLogDto> {
  return apiPut<SensorLogDto>(`/api/sensor-logs/${id}`, { ...body, id });
}

export async function deleteSensorLog(id: number): Promise<void> {
  return apiDelete(`/api/sensor-logs/${id}`);
}
