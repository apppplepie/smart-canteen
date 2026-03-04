import { request } from "@/http/axios"

/** 列表：分页，可选关键词模糊搜索（后端按表支持，如 users 表按用户名/手机号） */
export function getDataListApi(
  table: string,
  params: { currentPage: number, size: number, keyword?: string }
) {
  const send = { ...params }
  if (send.keyword === "" || send.keyword == null) delete send.keyword
  return request<{ code: number, data: { list: Record<string, unknown>[], total: number } }>({
    url: `data/${table}`,
    method: "get",
    params: send
  })
}

/** 单条 */
export function getDataOneApi(table: string, id: number) {
  return request<{ code: number, data: Record<string, unknown> }>({
    url: `data/${table}/${id}`,
    method: "get"
  })
}

/** 新增 */
export function createDataApi(table: string, data: Record<string, unknown>) {
  return request({
    url: `data/${table}`,
    method: "post",
    data
  })
}

/** 更新 */
export function updateDataApi(table: string, id: number, data: Record<string, unknown>) {
  return request({
    url: `data/${table}/${id}`,
    method: "put",
    data
  })
}

/** 删除 */
export function deleteDataApi(table: string, id: number) {
  return request({
    url: `data/${table}/${id}`,
    method: "delete"
  })
}
