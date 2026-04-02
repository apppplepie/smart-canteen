import type { SharedPost } from "../components/SharedPostDetail";
import { getRollingWeekRange } from "../lib/aiSummaryBuild";

/**
 * 演示热帖默认发帖时间：优先用「当前滚动周」内的 30 号（便于落在本周样本内）；
 * 若该周没有 30 号，则用本月 30 号，2 月等则用上月 30 号。
 */
export function defaultHotPostDay30(): string {
  const { start, end } = getRollingWeekRange();
  const dayMs = 86400000;
  for (let t = end.getTime(); t >= start.getTime(); t -= dayMs) {
    const x = new Date(t);
    if (x.getDate() === 30) {
      x.setHours(12, 0, 0, 0);
      return x.toISOString();
    }
  }
  const d = new Date();
  let y = d.getFullYear();
  let m = d.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  if (dim >= 30) {
    return new Date(y, m, 30, 12, 0, 0, 0).toISOString();
  }
  m -= 1;
  if (m < 0) {
    m = 11;
    y -= 1;
  }
  return new Date(y, m, 30, 12, 0, 0, 0).toISOString();
}

/**
 * 演示用「本周热帖」接口假数据。
 * 在 `.env.local` 中设置 `VITE_DEMO_MOCK_HOT_POSTS=true` 或 `VITE_DEMO_MOCK_AI=true` 后，
 * DynamicsTab 会调用 `fetchMockWeeklyHotPosts()` 覆盖 AI 小结里的热帖列表，
 * 并把这些帖并入向量检索的查询拼接与命中合并（与「检索增强」一致）。
 */
export const MOCK_WEEKLY_HOT_POSTS: SharedPost[] = [
  {
    id: 91001,
    user: { name: "干饭锦鲤", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hot1" },
    content: "一楼新开的咖喱窗口太香了，鸡块外酥里嫩，排队值得！\n建议错峰 11:20 前去。",
    likes: 186,
    comments: 47,
    merchantName: "南洋咖喱",
  },
  {
    id: 91002,
    user: { name: "轻食党", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hot2" },
    content: "二楼沙拉自助上新了牛油果酱，配鸡胸绝配，减脂期友好 🥑",
    likes: 142,
    comments: 28,
  },
  {
    id: 91003,
    user: { name: "碳水教父", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hot3" },
    content: "牛肉面窗口师傅手不抖！肉量感人，汤底偏咸记得少喝汤。",
    likes: 203,
    comments: 61,
  },
  {
    id: 91004,
    user: { name: "夜宵测评", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hot4" },
    content: "烧烤档鱿鱼须好评，辣椒面够劲；淀粉肠略软可以改进。",
    likes: 98,
    comments: 35,
  },
  {
    id: 91005,
    user: { name: "奶茶续命", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hot5" },
    content: "新品芋泥波波少糖刚好，芋泥颗粒感很足，下午课前来一杯刚好。",
    likes: 167,
    comments: 22,
  },
];

/** 模拟 GET /demo/weekly-hot-posts：延迟后返回热帖列表（时间统一为 30 号） */
export async function fetchMockWeeklyHotPosts(): Promise<SharedPost[]> {
  await new Promise((r) => setTimeout(r, 350));
  const postTime = defaultHotPostDay30();
  return MOCK_WEEKLY_HOT_POSTS.map((p) => ({ ...p, postTime }));
}
