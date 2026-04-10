import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { useTitle } from "@@/composables/useTitle"
import { getToken } from "@@/utils/local-storage"
import NProgress from "nprogress"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useUserStore } from "@/pinia/stores/user"
import { routerConfig } from "@/router/config"
import { isWhiteList } from "@/router/whitelist"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    // 已登录则勿停在登录页（入口为 /login，避免先进业务页再被踢回）
    if (to.path === LOGIN_PATH) {
      if (getToken()) {
        const r = to.query.redirect
        if (typeof r === "string" && r.length > 0) {
          try {
            return decodeURIComponent(r)
          } catch {
            return "/dashboard"
          }
        }
        return "/dashboard"
      }
      userStore.resetToken()
      return true
    }
    // 如果没有登录
    if (!getToken()) {
      // 如果在免登录的白名单中，则直接进入
      if (isWhiteList(to)) return true
      // 其他没有访问权限的页面将被重定向到登录页面
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }
    // 如果用户已经获得其权限角色
    if (userStore.roles.length !== 0) return true
    // 否则要重新获取权限角色
    try {
      await userStore.getInfo()
      // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
      const roles = userStore.roles
      // 生成可访问的 Routes
      routerConfig.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
      // 将 "有访问权限的动态路由" 添加到 Router 中
      permissionStore.addRoutes.forEach(route => router.addRoute(route))
      // 设置 replace: true, 因此导航将不会留下历史记录
      return { ...to, replace: true }
    } catch {
      // 不卡权限：拉取用户信息失败仍放行后台（占位名避免误显示为「管理员」账号）
      userStore.setGuardFallbackSession("已登录（用户信息未同步）", ["admin"])
      permissionStore.setRoutes(userStore.roles)
      permissionStore.addRoutes.forEach(route => router.addRoute(route))
      return { ...to, replace: true }
    }
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
