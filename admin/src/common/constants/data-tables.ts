/** 数据表英文 key -> 中文标题，侧栏显示为「中文 (英文)」 */
export const DATA_TABLE_TITLES: Record<string, string> = {
  users: "用户",
  vendors: "供应商",
  posts: "帖子",
  orders: "订单",
  order_items: "订单项",
  menu_items: "菜单项",
  agent_requests: "代理请求",
  audit_logs: "审计日志",
  call_events: "呼叫事件",
  nutrition_logs: "营养记录",
  queue_entries: "排队记录",
  retained_samples: "留样",
  sensor_logs: "传感器日志",
  stock_movements: "库存变动",
  test_reports: "检测报告"
}

export const DATA_TABLE_KEYS = Object.keys(DATA_TABLE_TITLES) as Array<keyof typeof DATA_TABLE_TITLES>

/** 表 key 对应的侧栏标题：中文 (英文) */
export function getDataTableTitle(key: string): string {
  const zh = DATA_TABLE_TITLES[key]
  return zh ? `${zh} (${key})` : key
}
