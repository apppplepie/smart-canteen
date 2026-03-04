<script lang="ts" setup>
import { Delete, Promotion } from "@element-plus/icons-vue"
import { useUserStore } from "@/pinia/stores/user"

const CHAT_API_BASE = (import.meta.env.VITE_CHAT_API_BASE_URL as string) || "http://localhost:8081"
const userStore = useUserStore()

interface Message {
  role: "user" | "assistant"
  content: string
}

const messages = ref<Message[]>([])
const conversationId = ref<number | null>(null)
const input = ref("")
const isLoading = ref(false)
const messagesContainerRef = ref<HTMLElement>()
const textareaRef = ref<HTMLElement>()

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

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
      if (data?.data?.conversationId != null) conversationId.value = data.data.conversationId
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
    messages.value = []
    conversationId.value = null
  })
}

/** 将消息内容中的代码块转为 HTML，其余内容转义后 pre-wrap 显示 */
function renderContent(content: string): string {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="code-block"><code>${code.trim()}</code></pre>`
  })
}
</script>

<template>
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
</template>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
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
    white-space: pre-wrap;
  }

  :deep(.code-block) {
    margin: 8px 0 0;
    padding: 10px 12px;
    background: rgba(0 0 0 / 8%);
    border-radius: 8px;
    overflow-x: auto;
    white-space: pre;

    code {
      font-family: "Consolas", "Monaco", monospace;
      font-size: 13px;
    }
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
