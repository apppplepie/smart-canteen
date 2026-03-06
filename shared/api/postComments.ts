import { apiGet, apiPost } from "./client";

export interface PostCommentDto {
  id?: number;
  postId: number;
  userId: number;
  content: string;
  createdAt?: string;
  userDisplayName?: string;
  userImageUrl?: string;
}

export async function listPostComments(postId: number): Promise<PostCommentDto[]> {
  return apiGet<PostCommentDto[]>(`/api/post-comments/post/${postId}`);
}

export async function createPostComment(body: { postId: number; userId: number; content: string }): Promise<PostCommentDto> {
  return apiPost<PostCommentDto>("/api/post-comments", body);
}
