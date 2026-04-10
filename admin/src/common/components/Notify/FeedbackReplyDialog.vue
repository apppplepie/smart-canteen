<script lang="ts" setup>
import type { AdminFeedbackPost } from "@@/apis/feedback/type"
import { patchOfficialReplyApi } from "@@/apis/feedback"
import DOMPurify from "dompurify"
import { marked } from "marked"

const props = defineProps<{
  modelValue: boolean
  post: AdminFeedbackPost | null
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "replied": []
}>()

marked.setOptions({ gfm: true, breaks: true })

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  taste: "口味",
  hygiene: "卫生",
  price: "价格",
  portion: "份量",
  speed: "速度",
  service: "服务态度",
  env: "环境卫生",
  other: "其他"
}

const draft = ref("")
const submitting = ref(false)

watch(
  () => [props.modelValue, props.post?.id] as const,
  ([open, _id]) => {
    if (open && props.post) {
      draft.value = ""
    }
  }
)

function feedbackTypeLabel(ft: string | undefined) {
  if (!ft) return "其他"
  return FEEDBACK_TYPE_LABELS[ft] ?? ft
}

function formatTime(iso: string | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("zh-CN", { hour12: false })
}

function renderMd(content: string | undefined | null) {
  const raw = (content ?? "").trim()
  if (!raw) return ""
  const rawHtml = marked(raw, { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "span",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "pre",
      "code",
      "blockquote",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"]
  })
}

function close() {
  emit("update:modelValue", false)
}

async function confirm() {
  const text = draft.value.trim()
  if (!text) {
    ElMessage.warning("请填写官方回复内容")
    return
  }
  if (!props.post?.id) return
  submitting.value = true
  try {
    await patchOfficialReplyApi(props.post.id, text)
    ElMessage.success("已提交官方回复")
    emit("replied")
    close()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    class="feedback-reply-dialog"
    title="回复食堂反馈"
    width="min(640px, 92vw)"
    align-center
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="post">
      <div class="feedback-reply-scroll">
        <el-descriptions :column="1" border size="small" class="meta-descriptions">
          <el-descriptions-item label="时间">
            {{ formatTime(post.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ post.userDisplayName?.trim() || "用户" }}
          </el-descriptions-item>
          <el-descriptions-item label="反馈类型">
            {{ feedbackTypeLabel(post.feedbackType) }}
          </el-descriptions-item>
        </el-descriptions>

        <section class="block">
          <div class="section-label">
            用户反馈内容
          </div>
          <el-input
            class="textarea-readonly"
            type="textarea"
            readonly
            :autosize="{ minRows: 4 }"
            :model-value="post.content ?? ''"
          />
        </section>

        <section class="block">
          <div class="section-label">
            AI 建议（Markdown）
          </div>
          <div v-if="!(post.aiSuggestion ?? '').trim()" class="ai-box text-muted">
            暂无 AI 建议（异步分析可能尚未完成，请稍后刷新）
          </div>
          <div v-else class="markdown-body ai-box" v-html="renderMd(post.aiSuggestion)" />
        </section>

        <section class="block block--reply">
          <div class="section-label">
            官方回复
          </div>
          <el-input
            v-model="draft"
            type="textarea"
            :autosize="{ minRows: 5 }"
            placeholder="请填写对师生的正式回复，提交后将标记为已回复"
            maxlength="2000"
            show-word-limit
          />
        </section>
      </div>
    </template>
    <template #footer>
      <el-button @click="close">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="confirm">
        确认回复
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.feedback-reply-scroll {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding-bottom: 4px;
}

.meta-descriptions {
  flex-shrink: 0;

  :deep(.el-descriptions__label) {
    width: 88px;
    font-weight: 500;
  }

  :deep(.el-descriptions__content) {
    line-height: 1.65;
    word-break: break-word;
  }
}

.block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.textarea-readonly {
  :deep(.el-textarea__inner) {
    line-height: 1.75;
    padding: 12px 14px;
    word-break: break-word;
    resize: none;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-blank);
  }
}

.ai-box {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  font-size: 14px;
  line-height: 1.75;
  word-break: break-word;

  :deep(p) {
    margin: 0 0 0.75em;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0.5em 0 0.75em;
    padding-left: 1.35em;
  }

  :deep(li) {
    margin: 0.35em 0;
  }

  :deep(pre) {
    margin: 0.75em 0;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
  }

  :deep(code) {
    font-size: 0.92em;
  }

  :deep(h1, h2, h3, h4) {
    margin: 1em 0 0.5em;
    line-height: 1.35;
    font-weight: 600;
  }

  :deep(h1:first-child, h2:first-child, h3:first-child) {
    margin-top: 0;
  }

  :deep(blockquote) {
    margin: 0.75em 0;
    padding: 8px 14px;
    border-left: 3px solid var(--el-color-primary-light-5);
    color: var(--el-text-color-regular);
  }
}

.text-muted {
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.75;
}

.block--reply {
  padding-top: 4px;

  :deep(.el-textarea__inner) {
    line-height: 1.75;
    padding: 12px 14px;
    min-height: 120px;
    word-break: break-word;
  }

  :deep(.el-input__count) {
    background: transparent;
  }
}
</style>

<style lang="scss">
/* append-to-body：滚动仅在弹窗正文，避免 scoped 选不到 teleport 内部 */
.feedback-reply-dialog .el-dialog__body {
  padding: 8px 20px 16px;
  max-height: calc(85vh - 140px);
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
