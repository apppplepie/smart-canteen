<script lang="ts" setup>
import type { AdminFeedbackPost } from "@@/apis/feedback/type"
import type { NotifyItem } from "./type"
import { getPendingFeedbackRepliesApi } from "@@/apis/feedback"
import { Bell } from "@element-plus/icons-vue"
import dayjs from "dayjs"
import FeedbackReplyDialog from "./FeedbackReplyDialog.vue"
import List from "./List.vue"

type TabName = "待办" | "通知"

interface DataItem {
  name: TabName
  type: "primary" | "success" | "warning" | "danger" | "info"
  list: NotifyItem[]
}

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

const router = useRouter()

const badgeMax = 99
const popoverWidth = 350
/** 默认打开「待办」，优先看到待回复反馈 */
const activeName = ref<TabName>("待办")

const pendingFeedback = ref<AdminFeedbackPost[]>([])
const replyDialogVisible = ref(false)
const selectedPost = ref<AdminFeedbackPost | null>(null)

/** 待办：需官方回复的食堂反馈（点击打开回复弹窗） */
const todoFeedbackItems = computed<NotifyItem[]>(() => {
  return pendingFeedback.value.map((p) => {
    const typeLabel = FEEDBACK_TYPE_LABELS[p.feedbackType ?? ""] ?? (p.feedbackType || "其他")
    const name = p.userDisplayName?.trim() || "用户"
    const content = (p.content ?? "").trim()
    const preview = content.length > 160 ? `${content.slice(0, 160)}…` : content
    return {
      postId: p.id,
      title: `${name} · ${typeLabel}`,
      description: preview || "（无文字内容）",
      datetime: p.createdAt ? dayjs(p.createdAt).format("YYYY-MM-DD HH:mm") : "",
      avatar: p.userImageUrl || undefined,
      extra: "待回复",
      status: "warning" as const
    }
  })
})

/** 通知：提醒管理员去「待办」填写官方回复（非点击回复入口） */
const notifyPanelItems = computed<NotifyItem[]>(() => {
  const n = pendingFeedback.value.length
  const now = dayjs().format("YYYY-MM-DD HH:mm")
  if (n === 0) {
    return [
      {
        title: "食堂反馈 · 官方回复",
        description: "当前没有待填写的官方回复。有新反馈且尚未回复时，会在「待办」中出现条目，并在此提醒你处理。",
        datetime: now
      }
    ]
  }
  return [
    {
      title: `请及时处理 ${n} 条官方回复`,
      description: "师生提交的食堂反馈尚未填写官方回复。请切换到「待办」标签，逐条点开卡片，在弹窗中填写并提交回复。",
      datetime: now
    }
  ]
})

/** 铃铛角标：与「待办」条数一致（待官方回复的反馈数） */
const badgeValue = computed(() => pendingFeedback.value.length)

const data = computed<DataItem[]>(() => [
  {
    name: "待办",
    type: "warning",
    list: todoFeedbackItems.value
  },
  {
    name: "通知",
    type: "primary",
    list: notifyPanelItems.value
  }
])

async function loadPendingFeedback() {
  try {
    const res = await getPendingFeedbackRepliesApi()
    pendingFeedback.value = res.data ?? []
  } catch {
    pendingFeedback.value = []
  }
}

function onPopoverShow() {
  loadPendingFeedback()
}

function onListItemClick(item: NotifyItem) {
  if (item.postId == null) return
  const p = pendingFeedback.value.find(x => x.id === item.postId)
  if (p) {
    selectedPost.value = p
    replyDialogVisible.value = true
  }
}

function onReplied() {
  loadPendingFeedback()
}

function handleHistory() {
  if (activeName.value === "待办") {
    router.push({ name: "DataPosts" }).catch(() => {})
    return
  }
  ElMessage.success("通知为系统提示，无单独历史页")
}

onMounted(() => {
  loadPendingFeedback()
})
</script>

<template>
  <div class="notify">
    <el-popover placement="bottom" :width="popoverWidth" trigger="click" @show="onPopoverShow">
      <template #reference>
        <el-badge :value="badgeValue" :max="badgeMax" :hidden="badgeValue === 0">
          <el-tooltip effect="dark" content="待办与通知" placement="bottom">
            <el-icon :size="20">
              <Bell />
            </el-icon>
          </el-tooltip>
        </el-badge>
      </template>
      <template #default>
        <el-tabs v-model="activeName" class="demo-tabs" stretch>
          <el-tab-pane v-for="(item, index) in data" :key="index" :name="item.name">
            <template #label>
              {{ item.name }}
              <el-badge
                v-if="item.name === '待办'"
                :value="todoFeedbackItems.length"
                :max="badgeMax"
                :type="item.type"
                :hidden="todoFeedbackItems.length === 0"
              />
            </template>
            <el-scrollbar height="400px">
              <List :data="item.list" @item-click="onListItemClick" />
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
        <div class="notify-history">
          <el-button link @click="handleHistory">
            {{ activeName === "待办" ? "去数据管理查看 posts" : `查看${activeName}相关说明` }}
          </el-button>
        </div>
      </template>
    </el-popover>

    <FeedbackReplyDialog
      v-model="replyDialogVisible"
      :post="selectedPost"
      @replied="onReplied"
    />
  </div>
</template>

<style lang="scss" scoped>
.notify-history {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
</style>
