import type { AdminFeedbackPost } from "./type"
import { request } from "@/http/axios"

/** 官方尚未回复的食堂反馈（posts，reply_content 为空） */
export function getPendingFeedbackRepliesApi() {
  return request<{ code: number, data: AdminFeedbackPost[], message: string }>({
    url: "admin/feedback/pending-replies",
    method: "get"
  })
}

/** 提交官方回复 */
export function patchOfficialReplyApi(id: number, replyContent: string) {
  return request<{ code: number, data: AdminFeedbackPost, message: string }>({
    url: `admin/feedback/${id}/reply`,
    method: "patch",
    data: { replyContent }
  })
}
