import type { SharedPost } from "../components/SharedPostDetail";

/** 我的动态 - 无接口或请求失败时的假数据 */
export const myPostsFallbackMock: SharedPost[] = [
  { id: 1, content: "今天一餐的麻辣烫太绝了！加了双份肥牛，汤底浓郁，简直是打工人的灵魂救赎 🍜✨", image: "https://picsum.photos/seed/p1/400/500", likes: 128, comments: 32, time: "2小时前" },
  { id: 2, content: "食堂新出的抹茶毛巾卷，口感绵密，抹茶味超浓郁，下午茶首选🍵", image: "https://picsum.photos/seed/p4/400/600", likes: 412, comments: 88, time: "昨天" },
];
