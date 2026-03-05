/** 发布动态 - 未选订单时的默认展示（选单来自 HistoryOrdersPage 或接口） */
export interface DefaultSelectedOrderMock {
  name: string;
  items: string;
  image: string;
  orderId?: number;
  vendorId?: number;
}

export const publishPageDefaultOrderMock: DefaultSelectedOrderMock = {
  name: "健康轻食沙拉",
  items: "招牌鸡胸肉沙拉",
  image: "https://picsum.photos/seed/m2/100/100",
};
