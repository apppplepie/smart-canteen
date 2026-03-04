<script lang="ts" setup>
import { marked } from "marked"
import DOMPurify from "dompurify"
import { Delete, Promotion, Plus, Fold, Expand } from "@element-plus/icons-vue"
import { useUserStore } from "@/pinia/stores/user"

marked.setOptions({ gfm: true, breaks: true })

const CHAT_API_BASE = (import.meta.env.VITE_CHAT_API_BASE_URL as string) || "http://localhost:8081"
const userStore = useUserStore()
/** 可选：用于拉取历史对话的用户 ID，不传则后端返回空列表 */
const AI_USER_ID = import.meta.env.VITE_AI_USER_ID ? Number(import.meta.env.VITE_AI_USER_ID) : null

interface Message {
  role: "user" | "assistant"
  content: string
}

interface HistoryItem {
  id: number
  title: string
  updatedAt: string
}

const messages = ref<Message[]>([])
const conversationId = ref<number | null>(null)
const input = ref("")
const isLoading = ref(false)
const messagesContainerRef = ref<HTMLElement>()
const textareaRef = ref<HTMLElement>()

// 历史对话：左侧可折叠面板
const historyList = ref<HistoryItem[]>([])
const historyLoading = ref(false)
const historyPanelCollapsed = ref(false)
const currentHistoryId = ref<number | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

/** 拉取历史对话列表（后端需传 userId 才有数据，可选 .env 配置 VITE_AI_USER_ID） */
async function fetchHistory() {
  historyLoading.value = true
  try {
    const url = AI_USER_ID != null
      ? `${CHAT_API_BASE.replace(/\/$/, "")}/api/ai/conversations?userId=${AI_USER_ID}`
      : `${CHAT_API_BASE.replace(/\/$/, "")}/api/ai/conversations`
    const res = await fetch(url)
    const raw = await res.text()
    const data = raw ? JSON.parse(raw) : {}
    const list = (data?.data ?? []) as { id: number; title: string; updatedAt: string }[]
    historyList.value = list.map((c) => ({
      id: c.id,
      title: c.title || "新对话",
      updatedAt: c.updatedAt
    }))
  } catch {
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

/** 格式化历史项时间 */
function formatHistoryTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (dDate.getTime() === today.getTime()) return "今天 " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  if (dDate.getTime() === yesterday.getTime()) return "昨天 " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("zh-CN") + " " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}

/** 打开某条历史对话 */
async function openHistory(id: number) {
  if (currentHistoryId.value === id) return
  historyLoading.value = true
  try {
    const res = await fetch(`${CHAT_API_BASE.replace(/\/$/, "")}/api/ai/conversations/${id}/messages`)
    const raw = await res.text()
    const data = raw ? JSON.parse(raw) : {}
    const list = (data?.data ?? []) as { role: string; content: string }[]
    messages.value = list
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content || "" }))
    conversationId.value = id
    currentHistoryId.value = id
    scrollToBottom()
  } catch {
    ElMessage.error("加载对话失败")
  } finally {
    historyLoading.value = false
  }
}

/** 新建对话 */
function startNewChat() {
  messages.value = []
  conversationId.value = null
  currentHistoryId.value = null
  fetchHistory()
}

onMounted(() => {
  fetchHistory()
})

async function sendMessage() {
  const content = input.value.trim()
  if (!content || isLoading.value) return

  input.value = ""
  messages.value.push({ role: "user", content })
  messages.value.push({ role: "assistant", content: "" })
  isLoading.value = true
  scrollToBottom()

  const lastIndex = messages.value.length - 1

  try {
    const apiMessages = messages.value
      .slice(0, -1)
      .map(({ role, content: c }) => ({ role, content: c }))
    const body: {
      messages: typeof apiMessages
      conversationId?: number | null
      clientType?: string
      role?: string
    } = {
      messages: apiMessages,
      clientType: "admin",
      role: userStore.roles?.[0] ?? "guest"
    }
    if (conversationId.value != null) body.conversationId = conversationId.value

    const response = await fetch(`${CHAT_API_BASE.replace(/\/$/, "")}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const raw = await response.text()
    let data: { code?: number; data?: { content?: string; conversationId?: number }; message?: string }
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }

    const isError = !response.ok || (data?.code !== undefined && data?.code !== 0)
    if (isError) {
      messages.value[lastIndex].content = data?.message || "请求失败，请检查网络或后端服务后重试。"
      ElMessage.error("发送失败")
    } else {
      const text = (data?.data?.content ?? "").trim() || "抱歉，我暂时无法回答这个问题。"
      messages.value[lastIndex].content = text
      if (data?.data?.conversationId != null) {
        conversationId.value = data.data.conversationId
        currentHistoryId.value = data.data.conversationId
        fetchHistory()
      }
    }
  } catch {
    messages.value[lastIndex].content = "请求失败，请检查网络或后端服务后重试。"
    ElMessage.error("发送失败")
  } finally {
    isLoading.value = false
  }
}

function handleKeydown(e: KeyboardEvent | Event) {
  const ev = e as KeyboardEvent
  if (ev.key === "Enter" && !ev.shiftKey) {
    ev.preventDefault()
    sendMessage()
  }
}

function clearMessages() {
  ElMessageBox.confirm("确认清空所有对话记录？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    startNewChat()
  })
}

/**
 * 使用 marked 将 Markdown 转为 HTML，再用 DOMPurify 做 XSS 过滤后输出
 */
function renderContent(content: string): string {
  if (!content?.trim()) return ""
  const rawHtml = marked(content, { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "p", "br", "span", "div",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "b", "i", "u", "s", "a",
      "ul", "ol", "li",
      "pre", "code",
      "blockquote", "hr",
      "table", "thead", "tbody", "tr", "th", "td"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"]
  })
}
</script>

<template>
  <div class="chat-layout">
    <!-- 左侧历史对话（可折叠） -->
    <aside class="history-aside" :class="{ collapsed: historyPanelCollapsed }">
      <div class="history-header">
        <el-button
          :icon="historyPanelCollapsed ? Expand : Fold"
          text
          circle
          size="small"
          :title="historyPanelCollapsed ? '展开历史' : '收起历史'"
          @click="historyPanelCollapsed = !historyPanelCollapsed"
        />
        <template v-if="!historyPanelCollapsed">
          <span class="history-title">历史对话</span>
          <el-button class="history-new-btn" :icon="Plus" text size="small" @click="startNewChat">新建</el-button>
        </template>
      </div>
      <div v-show="!historyPanelCollapsed" class="history-list-wrap">
        <el-scrollbar v-loading="historyLoading">
          <ul class="history-list">
            <li
              v-for="item in historyList"
              :key="item.id"
              class="history-item"
              :class="{ active: currentHistoryId === item.id }"
              @click="openHistory(item.id)"
            >
              <span class="history-item-title">{{ item.title }}</span>
              <span class="history-item-time">{{ formatHistoryTime(item.updatedAt) }}</span>
            </li>
          </ul>
          <p v-if="!historyLoading && historyList.length === 0" class="history-empty">
            暂无历史对话
            <template v-if="AI_USER_ID == null">（可配置 VITE_AI_USER_ID 按用户拉取）</template>
          </p>
        </el-scrollbar>
      </div>
    </aside>

    <div class="chat-page">
      <!-- 顶部标题栏 -->
      <div class="chat-header">
      <span class="chat-title">AI 助手</span>
      <span class="chat-subtitle">Spring Boot 转发 · 对话落库</span>
      <el-button
        v-if="messages.length > 0"
        :icon="Delete"
        size="small"
        text
        type="danger"
        class="clear-btn"
        @click="clearMessages"
      >
        清空对话
      </el-button>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesContainerRef" class="chat-messages">
      <!-- 欢迎界面 -->
      <transition name="fade">
        <div v-if="messages.length === 0" class="welcome">
          <div class="welcome-icon">🤖</div>
          <h2>你好，我是 AI 助手</h2>
          <p>有什么可以帮助你的？</p>
        </div>
      </transition>

      <!-- 消息气泡 -->
      <template v-for="(msg, index) in messages" :key="index">
        <div :class="['message-row', msg.role]">
          <div class="avatar">{{ msg.role === "user" ? "你" : "AI" }}</div>
          <div class="bubble">
            <!-- 空内容时显示打字动画 -->
            <span v-if="msg.role === 'assistant' && !msg.content && isLoading" class="typing">
              <span /><span /><span />
            </span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else class="content" v-html="renderContent(msg.content)" />
          </div>
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <el-input
        ref="textareaRef"
        v-model="input"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        resize="none"
        class="chat-input"
        :disabled="isLoading"
        @keydown="handleKeydown"
      />
      <el-button
        type="primary"
        :icon="Promotion"
        :loading="isLoading"
        :disabled="!input.trim()"
        circle
        class="send-btn"
        @click="sendMessage"
      />
    </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-layout {
  display: flex;
  height: calc(100vh - 100px);
  background: var(--el-bg-color);
}

.history-aside {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  transition: width 0.2s;

  &.collapsed {
    width: 52px;
    min-width: 52px;

    .history-header {
      justify-content: center;
    }
    .history-title,
    .history-list-wrap,
    .history-new-btn {
      display: none;
    }
  }
}

.history-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  .history-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.history-list-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;

  .el-scrollbar {
    height: 100%;
  }
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 8px;
}

.history-item {
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

.history-item-title {
  display: block;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-time {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.history-empty {
  padding: 16px 12px;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.chat-page {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  .chat-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .chat-subtitle {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-light);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .clear-btn {
    margin-left: auto;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  text-align: center;

  .welcome-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  &.user {
    flex-direction: row-reverse;

    .bubble {
      background: var(--el-color-primary);
      color: #fff;
      border-radius: 18px 4px 18px 18px;
    }

    .avatar {
      background: var(--el-color-primary);
      color: #fff;
    }
  }

  &.assistant {
    .bubble {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      border-radius: 4px 18px 18px 18px;
    }

    .avatar {
      background: var(--el-fill-color);
      color: var(--el-text-color-regular);
    }
  }
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.bubble {
  max-width: 70%;
  padding: 10px 14px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;

  .content {
    white-space: normal;

    :deep(p) { margin: 6px 0; }
    :deep(h1) { font-size: 1.25em; font-weight: 700; margin: 12px 0 6px; }
    :deep(h2) { font-size: 1.1em; font-weight: 600; margin: 10px 0 4px; }
    :deep(h3) { font-size: 1em; font-weight: 600; margin: 8px 0 4px; }
    :deep(ul), :deep(ol) { margin: 6px 0; padding-left: 20px; }
    :deep(ol) { list-style: decimal; }
    :deep(li) { margin: 2px 0; }
    :deep(code) {
      padding: 2px 6px;
      font-family: "Consolas", "Monaco", monospace;
      font-size: 13px;
      background: rgba(0 0 0 / 8%);
      border-radius: 4px;
    }
    :deep(pre) {
      margin: 8px 0;
      padding: 10px 12px;
      background: rgba(0 0 0 / 8%);
      border-radius: 8px;
      overflow-x: auto;
      white-space: pre;
    }
    :deep(pre code) {
      padding: 0;
      background: none;
    }
    :deep(a) { color: var(--el-color-primary); }
  }
}

.typing {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 20px;

  span {
    width: 6px;
    height: 6px;
    background: var(--el-text-color-placeholder);
    border-radius: 50%;
    animation: typing-bounce 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;

  .chat-input {
    flex: 1;

    :deep(.el-textarea__inner) {
      border-radius: 12px;
      padding: 10px 14px;
      line-height: 1.5;
      resize: none;
    }
  }

  .send-btn {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
