import { request } from "@/http/axios"

/** 列表：分页 */
export function getDataListApi(table: string, params: { currentPage: number, size: number }) {
  return request<{ code: number, data: { list: Record<string, unknown>[], total: number } }>({
    url: `data/${table}`,
    method: "get",
    params
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
