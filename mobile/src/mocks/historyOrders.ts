/** 历史订单 - 无后端或请求失败时的假数据 */
export interface HistoryOrderRowMock {
  id: number;
  name: string;
  time: string;
  price: string;
  status: string;
  image: string;
  items: string;
  vendorId?: number;
  totalAmount: number;
}

export const historyOrdersFallbackMock: HistoryOrderRowMock[] = [
  { id: 1, name: "健康轻食沙拉", time: "昨天 12:30", price: "28.00", status: "已完成", image: "https://picsum.photos/seed/m2/100/100", items: "招牌鸡胸肉沙拉 x1", totalAmount: 28 },
  { id: 2, name: "日式咖喱屋", time: "周二 18:15", price: "32.50", status: "已完成", image: "https://picsum.photos/seed/m4/100/100", items: "炸猪排咖喱饭 x1", totalAmount: 32.5 },
  { id: 3, name: "川香麻辣烫", time: "周一 12:00", price: "18.50", status: "已完成", image: "https://picsum.photos/seed/m1/100/100", items: "自选麻辣烫 x1", totalAmount: 18.5 },
];
