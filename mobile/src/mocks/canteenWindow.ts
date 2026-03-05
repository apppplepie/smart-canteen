/** 食堂在线 - 点击热力图窗口时的商家占位数据（窗口与商家关联可由后端 /api/windows 或 vendors 扩展） */
/** 与 MerchantPage 的 merchant 结构兼容 */
export interface WindowMerchantMock {
  id: number;
  name: string;
  rating?: number;
  sales?: number;
  time?: string;
  deliveryTime?: string;
  distance?: string;
  image?: string;
  tags?: string[];
}

export function getWindowMerchantByIndex(index: number): WindowMerchantMock {
  return {
    id: index + 1,
    name: `${index + 1}号窗口 - 特色美食`,
    rating: 4.8,
    sales: 1200,
    time: "10-15分钟",
    deliveryTime: "10-15分钟",
    distance: "100m",
    image: `https://picsum.photos/seed/w${index + 1}/800/400`,
    tags: ["人少免排队", "出餐快"],
  };
}
