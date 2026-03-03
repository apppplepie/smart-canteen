import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { TestReportDto } from "./types";

export async function listTestReports(): Promise<TestReportDto[]> {
  return apiGet<TestReportDto[]>("/api/test-reports");
}

export async function listTestReportsByVendor(vendorId: number): Promise<TestReportDto[]> {
  return apiGet<TestReportDto[]>(`/api/test-reports/vendor/${vendorId}`);
}

export async function getTestReport(id: number): Promise<TestReportDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/test-reports/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createTestReport(body: Omit<TestReportDto, "id">): Promise<TestReportDto> {
  return apiPost<TestReportDto>("/api/test-reports", body);
}

export async function updateTestReport(id: number, body: Partial<TestReportDto>): Promise<TestReportDto> {
  return apiPut<TestReportDto>(`/api/test-reports/${id}`, { ...body, id });
}

export async function deleteTestReport(id: number): Promise<void> {
  return apiDelete(`/api/test-reports/${id}`);
}
