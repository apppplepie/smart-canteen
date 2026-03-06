import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { PostDto } from "./types";

export async function listPosts(params?: { postType?: string }): Promise<PostDto[]> {
  const q = params?.postType ? `?postType=${encodeURIComponent(params.postType)}` : "";
  return apiGet<PostDto[]>(`/api/posts${q}`);
}

export async function listPostsByUser(userId: number, params?: { postType?: string }): Promise<PostDto[]> {
  const q = params?.postType ? `?postType=${encodeURIComponent(params.postType)}` : "";
  return apiGet<PostDto[]>(`/api/posts/user/${userId}${q}`);
}

export async function listPostsByVendor(vendorId: number): Promise<PostDto[]> {
  return apiGet<PostDto[]>(`/api/posts/vendor/${vendorId}`);
}

export async function getPost(id: number): Promise<PostDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/posts/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createPost(body: Partial<PostDto> & { content: string }): Promise<PostDto> {
  return apiPost<PostDto>("/api/posts", body);
}

export async function updatePost(id: number, body: Partial<PostDto>): Promise<PostDto> {
  return apiPut<PostDto>(`/api/posts/${id}`, { ...body, id });
}

export async function deletePost(id: number): Promise<void> {
  return apiDelete(`/api/posts/${id}`);
}
