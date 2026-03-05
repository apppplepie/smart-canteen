/** 点餐商家列表 - 无接口或请求失败时的假数据 */
export interface MerchantMock {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  time: string;
  distance: string;
  tags: string[];
  image: string;
  popular: boolean;
}

export const orderingMerchantsFallbackMock: MerchantMock[] = [
  { id: 1, name: "川香麻辣烫", rating: 4.8, reviews: 1205, time: "10-15 min", distance: "1F 东区", tags: ["麻辣鲜香", "自选"], image: "https://picsum.photos/seed/m1/400/300", popular: true },
  { id: 2, name: "健康轻食沙拉", rating: 4.9, reviews: 890, time: "5-10 min", distance: "2F 西区", tags: ["低脂", "减脂餐"], image: "https://picsum.photos/seed/m2/400/300", popular: false },
  { id: 3, name: "老北京炸酱面", rating: 4.6, reviews: 2300, time: "15-20 min", distance: "1F 中区", tags: ["面食", "地道"], image: "https://picsum.photos/seed/m3/400/300", popular: true },
  { id: 4, name: "日式咖喱屋", rating: 4.7, reviews: 650, time: "10-15 min", distance: "2F 东区", tags: ["咖喱", "日料"], image: "https://picsum.photos/seed/m4/400/300", popular: false },
];
