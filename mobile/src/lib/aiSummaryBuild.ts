import type { Vendor } from "../api/types";
import type { AiReportListItem } from "../api/snapshots";
import type { PostVectorSearchHit } from "../api/postVectorSearch";
import type { SharedPost } from "../components/SharedPostDetail";
import type {
  AISummaryDetailContent,
  AISummaryMerchant,
  AISummaryOfficialItem,
  AISummaryTopic,
} from "../components/AISummaryDetail";

/** 与帖子热度无关：用于第二次向量请求，从全库索引里尽量捞出分散命中（需后端已 rebuild） */
export const RAG_BROAD_FALLBACK_QUERY =
  "食堂 反馈 建议 意见 投诉 就餐 口味 卫生 排队 窗口 动态";

function sortByRecencyDesc(posts: SharedPost[]): SharedPost[] {
  return [...posts].sort((a, b) => {
    const ta = a.postTime ? new Date(a.postTime).getTime() : Number.NEGATIVE_INFINITY;
    const tb = b.postTime ? new Date(b.postTime).getTime() : Number.NEGATIVE_INFINITY;
    return tb - ta;
  });
}

/** 合并两次向量检索结果：同 postId 保留较高 score，再按分数排序 */
export function mergeVectorSearchHitLists(a: PostVectorSearchHit[], b: PostVectorSearchHit[]): PostVectorSearchHit[] {
  const byId = new Map<number, PostVectorSearchHit>();
  const ingest = (list: PostVectorSearchHit[]) => {
    for (const h of list) {
      const id = h.postId;
      if (id == null || Number.isNaN(Number(id))) continue;
      const prev = byId.get(id);
      const sc = h.score ?? 0;
      if (!prev || (prev.score ?? 0) < sc) {
        byId.set(id, h);
      }
    }
  };
  ingest(a);
  ingest(b);
  return [...byId.values()].sort((x, y) => (y.score ?? 0) - (x.score ?? 0));
}

export interface WeekRange {
  start: Date;
  end: Date;
  periodLabel: string;
}

export function getRollingWeekRange(): WeekRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const f = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return { start, end, periodLabel: `${f(start)}-${f(end)}` };
}

function isDynamicsPost(p: SharedPost): boolean {
  if (typeof p.id === "string" && p.id.startsWith("lost-")) return false;
  return p.postType !== "feedback";
}

function postInWeek(p: SharedPost, start: Date, end: Date): boolean {
  if (!p.postTime) return true;
  const t = new Date(p.postTime);
  if (Number.isNaN(t.getTime())) return true;
  return t >= start && t <= end;
}

function parseAiStructured(raw: string | undefined | null): { topics: AISummaryTopic[]; emotionLine?: string } {
  const empty: { topics: AISummaryTopic[]; emotionLine?: string } = { topics: [] };
  if (!raw?.trim()) return empty;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const topics: AISummaryTopic[] = [];
    const arr = o.topics ?? o.themes;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item === "string") {
          topics.push({ label: "话题", text: item });
        } else if (item && typeof item === "object") {
          const x = item as Record<string, unknown>;
          const label = String(x.label ?? x.title ?? "话题");
          const text = String(x.text ?? x.content ?? x.summary ?? "").trim();
          if (text) topics.push({ label, text });
        }
      }
    }
    let emotionLine: string | undefined;
    if (typeof o.emotion === "string" && o.emotion.trim()) emotionLine = o.emotion.trim();
    else if (o.sentiment && typeof o.sentiment === "object") {
      const s = (o.sentiment as Record<string, unknown>).summary;
      if (typeof s === "string" && s.trim()) emotionLine = s.trim();
    }
    return { topics, emotionLine };
  } catch {
    return empty;
  }
}

const FALLBACK_TOPICS: AISummaryTopic[] = [
  { label: "口味", text: "同学们近期对轻食、咖喱等口味讨论较多，可作选餐参考。" },
  { label: "排队", text: "午高峰部分窗口排队仍较明显，建议错峰或提前下单。" },
  { label: "卫生", text: "环境卫生相关反馈总体平稳，可继续留意就餐区整洁度。" },
];

const FALLBACK_EMOTION =
  "整体讨论偏中性偏正面；若样本较少，结论仅供参考，欢迎多发帖交流。";

const RAG_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=rag";

function firstLineFromPost(p: SharedPost): string {
  const t = (p.content ?? "").trim();
  return (t.split(/\n+/)[0] ?? "").slice(0, 96).trim();
}

/**
 * 拼主检索 query：优先「反馈/建议」正文与动态正文（按发帖时间新→旧，不按互动），再拼周报话题。
 * 前缀领域词帮助在样本极少、哈希嵌入场景下仍能向量化出可区分信号。
 */
export function buildWeeklyRagQuery(
  posts: SharedPost[],
  _week: WeekRange,
  weeklyReport: AiReportListItem | null,
): string {
  const dynamicsAll = posts.filter((p) => isDynamicsPost(p));
  const feedbackAll = posts.filter((p) => p.postType === "feedback");
  const parts: string[] = [];
  for (const p of sortByRecencyDesc(feedbackAll).slice(0, 4)) {
    const line = firstLineFromPost(p);
    if (line) parts.push(line);
  }
  for (const p of sortByRecencyDesc(dynamicsAll).slice(0, 2)) {
    const line = firstLineFromPost(p);
    if (line) parts.push(line);
  }
  const parsed = parseAiStructured(weeklyReport?.structuredPayloadJson);
  for (const t of parsed.topics.slice(0, 2)) {
    const x = t.text?.trim();
    if (x) parts.push(x.slice(0, 120));
  }
  if (parts.length === 0) {
    return RAG_BROAD_FALLBACK_QUERY;
  }
  const body = parts.join(" ").slice(0, 240);
  return `食堂 反馈 建议 ${body}`.trim().slice(0, 280);
}

/** 将向量检索结果与本地已拉取的帖子合并，便于展示完整卡片；未在列表中的帖用摘要构造占位卡片。 */
export function mergeVectorHitsWithLocalPosts(
  hits: PostVectorSearchHit[],
  localPosts: SharedPost[],
): { post: SharedPost; score: number }[] {
  const byId = new Map<number, SharedPost>();
  for (const p of localPosts) {
    const id = Number(p.id);
    if (!Number.isNaN(id)) {
      byId.set(id, p);
    }
  }
  const out: { post: SharedPost; score: number }[] = [];
  const seen = new Set<number>();
  for (const h of hits) {
    const pid = h.postId;
    if (!pid || Number.isNaN(pid) || seen.has(pid)) {
      continue;
    }
    seen.add(pid);
    const score = h.score ?? 0;
    const existing = byId.get(pid);
    if (existing) {
      out.push({ post: existing, score });
      continue;
    }
    const title = (h.title ?? "").trim();
    const content = (h.content ?? "").trim();
    const text = title ? `${title}\n${content}` : content;
    const looksFeedback =
      /\b反馈\b|建议|投诉|意见|窗口|卫生|排队/i.test(text) || /\bfeedback\b/i.test(text);
    out.push({
      post: {
        id: pid,
        user: { name: looksFeedback ? "相关反馈" : "相关帖", avatar: RAG_AVATAR },
        content: text || "（无正文摘要）",
        likes: 0,
        comments: 0,
        postType: looksFeedback ? "feedback" : undefined,
      },
      score,
    });
  }
  return out;
}

export interface AiSummaryBundle {
  periodLabel: string;
  detail: AISummaryDetailContent;
  cardSummaryLine: string;
  chips: string[];
}

export function buildAiSummaryBundle(
  posts: SharedPost[],
  vendors: Vendor[],
  weeklyReport: AiReportListItem | null,
  week: WeekRange,
  ragHits?: { post: SharedPost; score: number }[],
  ragQueryUsed?: string,
  /** 演示用：非空时覆盖本地统计得到的热帖（仍按互动取 1 条） */
  hotPostsOverride?: SharedPost[] | null,
): AiSummaryBundle {
  const { start, end, periodLabel } = week;

  const dynamicsInWeek = posts.filter((p) => isDynamicsPost(p) && postInWeek(p, start, end));
  const feedbackInWeek = posts.filter((p) => p.postType === "feedback" && postInWeek(p, start, end));
  const dynamicsAll = posts.filter((p) => isDynamicsPost(p));

  const sortByEngagement = (a: SharedPost, b: SharedPost) =>
    (b.likes ?? 0) + (b.comments ?? 0) - ((a.likes ?? 0) + (a.comments ?? 0));

  let hotPosts: SharedPost[];
  if (hotPostsOverride != null && hotPostsOverride.length > 0) {
    hotPosts = [...hotPostsOverride].sort(sortByEngagement).slice(0, 1);
  } else {
    hotPosts = [...dynamicsAll].sort(sortByEngagement).slice(0, 1);
  }

  const officialReplied: AISummaryOfficialItem[] = feedbackInWeek
    .filter((p) => {
      const s = (p.status ?? "").toLowerCase();
      return s === "replied";
    })
    .slice(0, 5)
    .map((post) => {
      const raw = (post.content ?? "").trim();
      const summaryLine = raw.split(/\n/)[0]?.slice(0, 56) ?? "反馈帖";
      return { post, summaryLine: summaryLine.length >= 56 ? summaryLine + "…" : summaryLine };
    });

  const redMerchants: AISummaryMerchant[] = [...vendors]
    .filter((v) => v.isActive !== false)
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 3)
    .map((v) => ({
      id: v.id,
      name: v.name,
      reason: `评分 ${(v.averageRating ?? 4.5).toFixed(1)} · 可作选餐参考`,
    }));

  const parsed = parseAiStructured(weeklyReport?.structuredPayloadJson);
  const topics = parsed.topics.length > 0 ? parsed.topics : FALLBACK_TOPICS;
  const emotionLine =
    parsed.emotionLine?.trim() ||
    weeklyReport?.executiveSummary?.split(/\n/).slice(1).join(" ").trim() ||
    FALLBACK_EMOTION;

  let statsFooter = `本周窗口内 ${dynamicsInWeek.length} 条动态 / ${feedbackInWeek.length} 条反馈；热帖为不限周期、当前列表中互动最高 1 条`;
  const hotIds = new Set(hotPosts.map((p) => String(p.id)));
  const ragFiltered =
    ragHits?.filter((h) => !hotIds.has(String(h.post.id))).slice(0, 8) ?? [];
  if (ragFiltered.length > 0) {
    statsFooter += ` · 已用语义检索补充 ${ragFiltered.length} 条关联帖`;
  }

  const detail: AISummaryDetailContent = {
    periodTitle: `本周食堂圈 · AI 小结 (${periodLabel})`,
    topics,
    emotionLine,
    statsFooter,
    hotPosts,
    redMerchants,
    officialReplied,
    ragHits: ragFiltered.length > 0 ? ragFiltered : undefined,
    ragNote:
      ragFiltered.length > 0 && ragQueryUsed?.trim()
        ? `以下帖子由帖子向量检索接口在全库索引上召回：主检索按反馈/动态正文与周报话题拼接（不按热度），并与全库宽泛词检索结果合并去重；相似度分数仅供参考。`
        : undefined,
    ragQueryHint: ragFiltered.length > 0 && ragQueryUsed?.trim() ? ragQueryUsed.trim().slice(0, 120) : undefined,
  };

  const chips: string[] = [];
  if (hotPosts.length > 0) chips.push("热帖");
  if (officialReplied.length > 0) chips.push("已回复");
  if (redMerchants.length > 0) chips.push("红榜");
  if (ragFiltered.length > 0) chips.push("检索增强");

  const apiFirstLine = weeklyReport?.executiveSummary?.trim().split(/\n/)[0]?.trim();
  const cardSummaryLine =
    apiFirstLine && apiFirstLine.length > 0
      ? apiFirstLine.length > 80
        ? apiFirstLine.slice(0, 80) + "…"
        : apiFirstLine
      : `本周 ${dynamicsInWeek.length} 条动态、${feedbackInWeek.length} 条反馈；${officialReplied.length} 条已官方回复。含 ${hotPosts.length} 篇热帖 · ${redMerchants.length} 个窗口参考。`;

  return { periodLabel, detail, cardSummaryLine, chips };
}
