import type { RouteLocationNormalizedGeneric, RouteRecordNameGeneric } from "vue-router"

/** 免登录白名单（仅登录页，未登录访问其他页会重定向到 /login） */
const whiteListByPath: string[] = ["/login"]

/** 免登录白名单（匹配路由 name） */
const whiteListByName: RouteRecordNameGeneric[] = []

/** 判断是否在白名单 */
export function isWhiteList(to: RouteLocationNormalizedGeneric) {
  // path 和 name 任意一个匹配上即可
  return whiteListByPath.includes(to.path) || whiteListByName.includes(to.name)
}
