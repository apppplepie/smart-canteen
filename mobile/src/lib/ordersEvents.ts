/** 下单成功后派发，用于「我的」最近订单、历史订单列表刷新 */
export const SCS_ORDERS_UPDATED = "scs-orders-updated";

export function dispatchOrdersUpdated(): void {
  try {
    window.dispatchEvent(new CustomEvent(SCS_ORDERS_UPDATED));
  } catch {
    /* ignore */
  }
}
