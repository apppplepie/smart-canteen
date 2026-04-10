export interface NotifyItem {
  avatar?: string
  title: string
  datetime?: string
  description?: string
  status?: "primary" | "success" | "info" | "warning" | "danger"
  extra?: string
  /** 有值时表示来自待回复食堂反馈，点击打开回复弹窗 */
  postId?: number
}
