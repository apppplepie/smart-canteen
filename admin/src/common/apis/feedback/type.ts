/** 与后端 Post 对齐的管理端反馈项（待官方回复列表） */
export interface AdminFeedbackPost {
  id: number
  title?: string
  content?: string
  feedbackType?: string
  postType?: string
  aiSuggestion?: string | null
  replyContent?: string | null
  status?: string
  createdAt?: string
  userId?: number | null
  userDisplayName?: string | null
  userImageUrl?: string | null
}
