import type { SharedPost } from "../components/SharedPostDetail";

/** 动态流 - 无接口或请求失败时的假数据 */
export type DynamicsPost = SharedPost & { height?: string; isLatest?: boolean };

export const dynamicsPostsFallbackMock: DynamicsPost[] = [
  { id: 1, user: { name: "干饭王", avatar: "https://picsum.photos/seed/u1/100/100" }, content: "今天一餐的麻辣烫太绝了！加了双份肥牛，汤底浓郁，简直是打工人的灵魂救赎 🍜✨", image: "https://picsum.photos/seed/p1/400/500", likes: 128, comments: 32, time: "2小时前", height: "h-64", merchantId: 1, merchantName: "川香麻辣烫", dishName: "自选麻辣烫", isLatest: true },
  { id: 2, user: { name: "减脂小分队", avatar: "https://picsum.photos/seed/u2/100/100" }, content: "二楼的轻食沙拉分量好足，鸡胸肉一点都不柴，推荐搭配油醋汁🥗", image: "https://picsum.photos/seed/p2/400/300", likes: 89, comments: 15, time: "4小时前", height: "h-48", merchantId: 2, merchantName: "健康轻食沙拉", dishName: "招牌鸡胸肉沙拉", isLatest: true },
  { id: 3, user: { name: "碳水狂魔", avatar: "https://picsum.photos/seed/u3/100/100" }, content: "老北京炸酱面yyds！面条劲道，酱香浓郁，配上黄瓜丝绝了🥒", image: "https://picsum.photos/seed/p3/400/400", likes: 256, comments: 64, time: "昨天", height: "h-56", merchantId: 3, merchantName: "老北京炸酱面", dishName: "经典炸酱面", isLatest: false },
  { id: 4, user: { name: "甜品控", avatar: "https://picsum.photos/seed/u4/100/100" }, content: "食堂新出的抹茶毛巾卷，口感绵密，抹茶味超浓郁，下午茶首选🍵", image: "https://picsum.photos/seed/p4/400/600", likes: 412, comments: 88, time: "昨天", height: "h-72", merchantId: 4, merchantName: "日式咖喱屋", dishName: "抹茶毛巾卷", isLatest: false },
  { id: 5, user: { name: "热心同学", avatar: "https://picsum.photos/seed/u5/100/100" }, content: "【寻物启事】昨天中午在一楼食堂丢了一把黑色的雨伞，伞柄有划痕。有捡到的同学麻烦联系我，必有重谢！", image: "https://picsum.photos/seed/umbrella/400/300", likes: 12, comments: 3, time: "2小时前", height: "h-48", isLatest: true, tags: ["寻物启事", "一楼东区"] },
  { id: 6, user: { name: "食堂大妈", avatar: "https://picsum.photos/seed/u6/100/100" }, content: "【失物招领】在二楼西区靠窗的桌子上捡到一张校园卡，名字叫张三，已交到二楼服务台，请失主尽快来领取。", image: "https://picsum.photos/seed/card/400/300", likes: 45, comments: 1, time: "昨天", height: "h-56", isLatest: false, tags: ["失物招领", "二楼服务台"] },
  { id: 7, user: { name: "匿名用户", avatar: "https://picsum.photos/seed/anon/100/100" }, content: "【问题反馈】二楼靠窗的桌子有些油腻，希望能加强清理频率。环境卫生需要大家共同维护。", image: "", likes: 88, comments: 15, time: "昨天", height: "h-32", isLatest: false, tags: ["问题反馈", "环境卫生"] },
];
