<script lang="ts" setup>
import { getDataListApi, createDataApi, updateDataApi, deleteDataApi } from "@@/apis/data"
import { usePagination } from "@@/composables/usePagination"
import { CirclePlus, Delete, Refresh } from "@element-plus/icons-vue"

const route = useRoute()
/** 接口用表名（英文） */
const tableName = computed(() => (route.meta.table as string) || route.path.split("/").pop() || "")
/** 页面标题：中文 (英文) */
const pageTitle = computed(() => (route.meta.title as string) || tableName.value)

/** 表单字段名列表，避免在模板里用 Object.keys 导致 v-model 响应式失效 */
const formKeys = computed(() => Object.keys(formData.value).filter(k => k !== "class"))

const loading = ref(false)
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const tableData = ref<Record<string, unknown>[]>([])
const columns = ref<string[]>([])

const dialogVisible = ref(false)
const formData = ref<Record<string, unknown>>({})
const isEdit = ref(false)

function getList() {
  if (!tableName.value) return
  loading.value = true
  getDataListApi(tableName.value, {
    currentPage: paginationData.currentPage,
    size: paginationData.pageSize
  }).then(({ data }) => {
    paginationData.total = data.total
    tableData.value = data.list || []
    if (tableData.value.length > 0) {
      columns.value = Object.keys(tableData.value[0]).filter(k => k !== "class")
    } else {
      columns.value = []
    }
  }).catch(() => {
    tableData.value = []
    columns.value = []
  }).finally(() => {
    loading.value = false
  })
}

function handleAdd() {
  isEdit.value = false
  formData.value = columns.value.length
    ? Object.fromEntries(columns.value.map(c => [c, c === "id" ? undefined : ""]))
    : {}
  dialogVisible.value = true
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true
  formData.value = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, v != null && typeof v === "object" ? JSON.stringify(v) : v])
  )
  dialogVisible.value = true
}

function handleDelete(row: Record<string, unknown>) {
  const id = row.id as number
  if (id == null) return
  ElMessageBox.confirm("确认删除？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDataApi(tableName.value, id).then(() => {
      ElMessage.success("删除成功")
      getList()
    })
  })
}

function submitForm() {
  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(formData.value)) {
    if (v === "" || v === undefined) continue
    if (typeof v === "string" && (v.startsWith("{") || v.startsWith("["))) {
      try { payload[k] = JSON.parse(v) } catch { payload[k] = v }
    } else if (k === "id" && typeof v === "number") {
      payload[k] = v
    } else if (typeof v === "number") {
      payload[k] = v
    } else {
      payload[k] = v
    }
  }
  if (!isEdit.value) delete payload.id
  const api = isEdit.value
    ? updateDataApi(tableName.value, payload.id as number, payload)
    : createDataApi(tableName.value, payload)
  api.then(() => {
    ElMessage.success("保存成功")
    dialogVisible.value = false
    getList()
  })
}

watch(tableName, getList, { immediate: true })
watch([() => paginationData.currentPage, () => paginationData.pageSize], getList)
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center gap-2">
      <span class="text-lg font-medium">{{ pageTitle }}</span>
    </div>
    <div class="mb-4 flex gap-2">
      <el-button type="primary" :icon="CirclePlus" @click="handleAdd">
        新增
      </el-button>
      <el-button :icon="Refresh" @click="getList">
        刷新
      </el-button>
    </div>
    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column
        v-for="col in columns"
        :key="col"
        :prop="col"
        :label="col"
        min-width="120"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ typeof row[col] === "object" && row[col] !== null ? JSON.stringify(row[col]) : row[col] }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-4 flex justify-end">
      <el-pagination
        :current-page="paginationData.currentPage"
        :page-size="paginationData.pageSize"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :layout="paginationData.layout"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑' : '新增'" width="500px">
      <el-form label-width="100px">
        <el-form-item
          v-for="col in formKeys"
          :key="col"
          :label="col"
        >
          <el-input
            :model-value="formData[col] != null ? String(formData[col]) : ''"
            :disabled="col === 'id' && isEdit"
            type="textarea"
            :autosize="{ minRows: 1 }"
            @update:model-value="(val) => (formData[col] = val)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
