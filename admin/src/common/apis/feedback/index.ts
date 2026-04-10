import type { AdminFeedbackPost } from "./type"
import { request } from "@/http/axios"

/**
 * 官方尚未回复的食堂反馈（读 posts 表）
 * 使用 `/api/v1/data/posts/...`，与 admin 的 `VITE_BASE_URL=/api/v1` 一致，避免旧部署无 `admin/feedback` 路由导致 404。
 */
export function getPendingFeedbackRepliesApi() {
  return request<{ code: number, data: AdminFeedbackPost[], message: string }>({
    url: "data/posts/pending-official-replies",
    method: "get"
  })
}

/** 提交官方回复 */
export function patchOfficialReplyApi(id: number, replyContent: string) {
  return request<{ code: number, data: AdminFeedbackPost, message: string }>({
    url: `data/posts/${id}/official-reply`,
    method: "patch",
    data: { replyContent }
  })
}
