import { apiGet, apiPost } from "./client";

export interface LostItemCommentDto {
  id?: number;
  lostItemId: number;
  userId: number;
  content: string;
  createdAt?: string;
  userDisplayName?: string;
  userImageUrl?: string;
}

export async function listLostItemComments(lostItemId: number): Promise<LostItemCommentDto[]> {
  return apiGet<LostItemCommentDto[]>(`/api/lost-item-comments/lost-item/${lostItemId}`);
}

export async function createLostItemComment(body: {
  lostItemId: number;
  userId: number;
  content: string;
}): Promise<LostItemCommentDto> {
  return apiPost<LostItemCommentDto>("/api/lost-item-comments", body);
}
