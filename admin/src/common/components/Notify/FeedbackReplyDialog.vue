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
    title="回复食堂反馈"
    width="640px"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="post">
      <el-descriptions :column="1" border size="small" class="mb-3">
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

      <div class="section-label">
        用户反馈内容
      </div>
      <el-input
        class="mb-4"
        type="textarea"
        :rows="4"
        readonly
        :model-value="post.content ?? ''"
      />

      <div class="section-label">
        AI 建议（Markdown）
      </div>
      <div v-if="!(post.aiSuggestion ?? '').trim()" class="ai-box mb-4 text-muted">
        暂无 AI 建议（异步分析可能尚未完成，请稍后刷新）
      </div>
      <div v-else class="markdown-body ai-box mb-4" v-html="renderMd(post.aiSuggestion)" />

      <div class="section-label">
        官方回复
      </div>
      <el-input
        v-model="draft"
        type="textarea"
        :rows="4"
        placeholder="请填写对师生的正式回复，提交后将标记为已回复"
        maxlength="2000"
        show-word-limit
      />
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
.section-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.ai-box {
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 13px;
  line-height: 1.6;
  max-height: 280px;
  overflow: auto;

  :deep(p) {
    margin: 0 0 0.5em;
  }
  :deep(p:last-child) {
    margin-bottom: 0;
  }
}

.text-muted {
  color: var(--el-text-color-secondary);
  margin: 0;
}
</style>
