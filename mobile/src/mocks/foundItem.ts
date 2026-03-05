/** 失物招领 - 我的招领列表假数据 */
export interface FoundItemMock {
  id: number;
  user: { name: string; avatar: string };
  content: string;
  image: string;
  location: string;
  time: string;
  isReturned: boolean;
  postTime: string;
}

export const foundItemHistoryMock: FoundItemMock[] = [
  {
    id: 1,
    user: { name: "我", avatar: "https://picsum.photos/seed/me/100/100" },
    content: "在二楼西区靠窗的桌子上捡到一张校园卡，名字叫张三，已交到二楼服务台。",
    image: "https://picsum.photos/seed/card/400/300",
    location: "二楼西区",
    time: "今天 11:30",
    isReturned: false,
    postTime: "1小时前",
  },
];
