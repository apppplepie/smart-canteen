import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { Post } from "./types";

export async function listPosts(): Promise<Post[]> {
  return apiGet<Post[]>("/api/posts");
}

export async function listPostsByUser(userId: number): Promise<Post[]> {
  return apiGet<Post[]>(`/api/posts/user/${userId}`);
}

export async function listPostsByVendor(vendorId: number): Promise<Post[]> {
  return apiGet<Post[]>(`/api/posts/vendor/${vendorId}`);
}

export async function getPost(id: number): Promise<Post | null> {
  const res = await fetch((import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") + `/api/posts/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createPost(body: {
  userId?: number;
  vendorId?: number;
  title?: string;
  content: string;
  mediaUrls?: string;
}): Promise<Post> {
  return apiPost<Post>("/api/posts", body);
}

export async function updatePost(id: number, body: Partial<Post>): Promise<Post> {
  return apiPut<Post>(`/api/posts/${id}`, { ...body, id });
}

export async function deletePost(id: number): Promise<void> {
  return apiDelete(`/api/posts/${id}`);
}
