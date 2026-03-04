import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { getDataTableTitle } from "@@/constants/data-tables"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  { path: "/", redirect: "/dashboard", meta: { hidden: true } },
  {
    path: "/dashboard",
    component: Layouts,
    children: [
      {
        path: "",
        component: () => import("@/pages/chat/index.vue"),
        name: "Dashboard",
        meta: {
          title: "AI 助手",
          elIcon: "ChatDotRound",
          affix: true
        }
      }
    ]
  },
  {
    path: "/data",
    component: Layouts,
    redirect: "/data/users",
    name: "DataManagement",
    meta: {
      title: "数据管理",
      elIcon: "Folder",
      alwaysShow: true
    },
    children: [
      { path: "users", component: () => import("@/pages/data/table.vue"), name: "DataUsers", meta: { title: getDataTableTitle("users"), table: "users" } },
      { path: "vendors", component: () => import("@/pages/data/table.vue"), name: "DataVendors", meta: { title: getDataTableTitle("vendors"), table: "vendors" } },
      { path: "posts", component: () => import("@/pages/data/table.vue"), name: "DataPosts", meta: { title: getDataTableTitle("posts"), table: "posts" } },
      { path: "orders", component: () => import("@/pages/data/table.vue"), name: "DataOrders", meta: { title: getDataTableTitle("orders"), table: "orders" } },
      { path: "order_items", component: () => import("@/pages/data/table.vue"), name: "DataOrderItems", meta: { title: getDataTableTitle("order_items"), table: "order_items" } },
      { path: "menu_items", component: () => import("@/pages/data/table.vue"), name: "DataMenuItems", meta: { title: getDataTableTitle("menu_items"), table: "menu_items" } },
      { path: "agent_requests", component: () => import("@/pages/data/table.vue"), name: "DataAgentRequests", meta: { title: getDataTableTitle("agent_requests"), table: "agent_requests" } },
      { path: "ai_conversations", component: () => import("@/pages/data/table.vue"), name: "DataAiConversations", meta: { title: getDataTableTitle("ai_conversations"), table: "ai_conversations" } },
      { path: "ai_messages", component: () => import("@/pages/data/table.vue"), name: "DataAiMessages", meta: { title: getDataTableTitle("ai_messages"), table: "ai_messages" } },
      { path: "audit_logs", component: () => import("@/pages/data/table.vue"), name: "DataAuditLogs", meta: { title: getDataTableTitle("audit_logs"), table: "audit_logs" } },
      { path: "call_events", component: () => import("@/pages/data/table.vue"), name: "DataCallEvents", meta: { title: getDataTableTitle("call_events"), table: "call_events" } },
      { path: "nutrition_logs", component: () => import("@/pages/data/table.vue"), name: "DataNutritionLogs", meta: { title: getDataTableTitle("nutrition_logs"), table: "nutrition_logs" } },
      { path: "queue_entries", component: () => import("@/pages/data/table.vue"), name: "DataQueueEntries", meta: { title: getDataTableTitle("queue_entries"), table: "queue_entries" } },
      { path: "retained_samples", component: () => import("@/pages/data/table.vue"), name: "DataRetainedSamples", meta: { title: getDataTableTitle("retained_samples"), table: "retained_samples" } },
      { path: "sensor_logs", component: () => import("@/pages/data/table.vue"), name: "DataSensorLogs", meta: { title: getDataTableTitle("sensor_logs"), table: "sensor_logs" } },
      { path: "stock_movements", component: () => import("@/pages/data/table.vue"), name: "DataStockMovements", meta: { title: getDataTableTitle("stock_movements"), table: "stock_movements" } },
      { path: "test_reports", component: () => import("@/pages/data/table.vue"), name: "DataTestReports", meta: { title: getDataTableTitle("test_reports"), table: "test_reports" } }
    ]
  }
]

/** 动态路由（当前未使用，仅保留结构） */
export const dynamicRoutes: RouteRecordRaw[] = []

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
