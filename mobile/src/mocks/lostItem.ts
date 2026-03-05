/** 寻物启事 - 我的寻物列表假数据 */
export interface LostItemMock {
  id: number;
  user: { name: string; avatar: string };
  content: string;
  image: string;
  location: string;
  time: string;
  isFound: boolean;
  postTime: string;
}

export const lostItemHistoryMock: LostItemMock[] = [
  {
    id: 1,
    user: { name: "我", avatar: "https://picsum.photos/seed/me/100/100" },
    content: "昨天中午在一楼食堂丢了一把黑色的雨伞，伞柄有划痕。",
    image: "https://picsum.photos/seed/umbrella/400/300",
    location: "一楼东区",
    time: "昨天 12:00",
    isFound: false,
    postTime: "2小时前",
  },
];
