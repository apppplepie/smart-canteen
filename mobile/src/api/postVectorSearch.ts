import { getBaseUrl } from "./client";

export interface PostVectorSearchHit {
  postId: number;
  title?: string;
  content?: string;
  score?: number;
  embeddingModel?: string;
}

export interface PostVectorSearchResponse {
  query: string;
  topK: number;
  results: PostVectorSearchHit[];
  runtime?: Record<string, unknown>;
}

/** 默认向量检索超时（毫秒）；演示场景避免长时间挂起等后端嵌入 */
export const DEFAULT_VECTOR_SEARCH_TIMEOUT_MS = 5000;

export interface SearchPostsByVectorOptions {
  /** 超时后中止请求，返回 null（由调用方决定是否走前端 mock） */
  timeoutMs?: number;
}

/**
 * 帖子语义检索（Spring Boot /api/vector/posts/search），供周报 RAG 等场景拉取关联帖。
 */
export async function searchPostsByVector(
  query: string,
  topK = 8,
  opts?: SearchPostsByVectorOptions,
): Promise<PostVectorSearchResponse | null> {
  const base = getBaseUrl();
  if (!base || !query.trim()) {
    return null;
  }
  const q = new URLSearchParams({
    query: query.trim(),
    topK: String(Math.min(20, Math.max(1, topK))),
  });
  const url = `${base.replace(/\/$/, "")}/api/vector/posts/search?${q.toString()}`;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_VECTOR_SEARCH_TIMEOUT_MS;
  const ac = new AbortController();
  const tid = window.setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as Record<string, unknown>;
    const raw = body.results;
    const results: PostVectorSearchHit[] = Array.isArray(raw)
      ? raw.map((r: Record<string, unknown>) => ({
          postId: Number(r.postId),
          title: typeof r.title === "string" ? r.title : undefined,
          content: typeof r.content === "string" ? r.content : undefined,
          score: typeof r.score === "number" ? r.score : undefined,
          embeddingModel: typeof r.embeddingModel === "string" ? r.embeddingModel : undefined,
        }))
      : [];
    return {
      query: typeof body.query === "string" ? body.query : query,
      topK: typeof body.topK === "number" ? body.topK : topK,
      results,
      runtime: typeof body.runtime === "object" && body.runtime != null ? (body.runtime as Record<string, unknown>) : undefined,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(tid);
  }
}
