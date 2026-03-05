/** 商家菜单 - 无接口或请求失败时的假数据 */
export interface MenuItemRowMock {
  id: number;
  name: string;
  price: number;
  desc: string;
  image: string;
  popular: boolean;
}

export const merchantMenuFallbackMock: MenuItemRowMock[] = [
  { id: 1, name: "招牌麻辣烫", price: 18, desc: "包含牛丸、鱼豆腐、生菜等10种配菜", image: "https://picsum.photos/seed/d1/200/200", popular: true },
  { id: 2, name: "番茄肥牛面", price: 22, desc: "浓郁番茄汤底，精选肥牛卷", image: "https://picsum.photos/seed/d2/200/200", popular: true },
  { id: 3, name: "金汤酸菜鱼", price: 28, desc: "酸辣开胃，无骨鱼片", image: "https://picsum.photos/seed/d3/200/200", popular: false },
];
