import { getBaseUrl } from "./client";

export interface AiReportListItem {
  id?: number;
  reportType?: string;
  executiveSummary?: string;
  structuredPayloadJson?: string;
  periodStart?: string;
  periodEnd?: string;
  title?: string;
}

interface ApiEnvelope<T> {
  code?: number;
  data?: T;
  message?: string;
}

/**
 * 拉取 AI 周期报告列表（与后端 GET /api/snapshots/ai-reports 对齐）。
 */
export async function listAiPeriodReports(params: {
  scopeType?: string;
  scopeId?: number;
  reportType?: string;
  page?: number;
  size?: number;
}): Promise<{ items: AiReportListItem[]; stubNote?: string; placeholder?: boolean }> {
  const base = getBaseUrl();
  if (!base) {
    return { items: [] };
  }
  const q = new URLSearchParams();
  q.set("scopeType", params.scopeType ?? "global");
  q.set("scopeId", String(params.scopeId ?? 0));
  q.set("page", String(params.page ?? 1));
  q.set("size", String(params.size ?? 10));
  if (params.reportType != null && params.reportType !== "") {
    q.set("reportType", params.reportType);
  }
  const url = `${base.replace(/\/$/, "")}/api/snapshots/ai-reports?${q.toString()}`;
  const res = await fetch(url);
  const raw = await res.text();
  let body: ApiEnvelope<{
    items?: AiReportListItem[];
    stubNote?: string;
    placeholder?: boolean;
  }> = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return { items: [] };
  }
  const data = body.data;
  const items = Array.isArray(data?.items) ? data!.items! : [];
  return {
    items,
    stubNote: data?.stubNote,
    placeholder: data?.placeholder,
  };
}
