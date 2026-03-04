/**
 * 将后端 DTO 转成前端页面使用的结构
 */
import type { Dish } from '../components/menu/DishCardModal';
import type { VendorDto, MenuItemDto, QueueEntryDto, TestReportDto, RetainedSampleDto, SensorLogDto, PostDto, FoundItemDto, LostItemDto } from '@scs/api';
import { getApiBaseUrl } from '@scs/api';

const defaultImage = (id: number) => `https://picsum.photos/seed/dish${id}/600/800`;

/** 将相对路径（如 /api/images/xxx.jpg）转为带后端基地址的完整 URL，否则返回原串 */
function resolveImageUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getApiBaseUrl();
  if (base) {
    const baseNorm = base.replace(/\/+$/, '');
    return u.startsWith('/') ? `${baseNorm}${u}` : `${baseNorm}/${u}`;
  }
  return u;
}

/** MenuItem + Vendor -> Dish（优先使用数据库 image_url，无则占位图；相对路径会拼后端 baseURL） */
export function menuItemToDish(mi: MenuItemDto, vendor: VendorDto): Dish {
  const rawImage = mi.imageUrl?.trim();
  return {
    id: mi.id,
    name: mi.name,
    merchant: vendor.name ?? '',
    window: vendor.locationLabel ?? '',
    price: Number(mi.price),
    rating: 4.5,
    tags: [],
    image: rawImage ? resolveImageUrl(rawImage) : defaultImage(mi.id),
    desc: mi.description ?? '',
    calories: mi.calories ?? 0,
    sales: 0,
  };
}

/** 多个 MenuItem + Vendor 列表 -> Dish[]（按 vendorId 查 vendor） */
export function menuItemsToDishes(items: MenuItemDto[], vendors: VendorDto[]): Dish[] {
  const byId = new Map(vendors.map((v) => [v.id, v]));
  return items
    .map((mi) => {
      const v = byId.get(mi.vendorId);
      return v ? menuItemToDish(mi, v) : null;
    })
    .filter((d): d is Dish => d != null);
}

/** 按 vendor 聚合 queue_entries 数量，生成 status */
export function buildDashboardWindow(
  vendor: VendorDto,
  queueCount: number,
  firstDishName?: string
): { id: string; name: string; status: 'idle' | 'busy' | 'congested'; queue: number; wait: string; dish: string; image: string } {
  let status: 'idle' | 'busy' | 'congested' = 'idle';
  if (queueCount > 15) status = 'congested';
  else if (queueCount > 5) status = 'busy';
  const wait = `${Math.max(1, Math.round(queueCount * 1.5))}min`;
  return {
    id: `W${String(vendor.id).padStart(2, '0')}`,
    name: vendor.name ?? `${vendor.id}号窗`,
    status,
    queue: queueCount,
    wait,
    dish: firstDishName ?? '今日套餐',
    image: `https://picsum.photos/seed/win${vendor.id}/400/300`,
  };
}

/** TestReport -> 食安公示卡片（需配合前端 icon，这里只返回数据） */
export function testReportToDisplay(r: TestReportDto): {
  id: number;
  type: string;
  result: string;
  agency: string;
  time: string;
} {
  const tested = r.testedAt ? formatDateTime(r.testedAt) : '今日';
  return {
    id: r.id,
    type: r.itemType ?? '检测',
    result: (r.result ?? '').toUpperCase(),
    agency: r.labName ?? '',
    time: tested,
  };
}

/** RetainedSample -> 留样追踪行 */
export function retainedSampleToDisplay(r: RetainedSampleDto): {
  id: string;
  meal: string;
  time: string;
  loc: string;
  status: string;
  operator: string;
} {
  const collected = r.collectedAt ? formatTime(r.collectedAt) : '--';
  return {
    id: r.sampleCode ?? `S-${r.id}`,
    meal: '留样',
    time: collected,
    loc: r.storageLocation ?? '--',
    status: r.status ?? '冷藏中 (48h)',
    operator: '--',
  };
}

/** SensorLog[] -> 温度/浓度时序（按 metric 分组，按 recordedAt 排序） */
export function sensorLogsToTimeSeries(logs: SensorLogDto[]): { time: string; temp: number; ppm: number }[] {
  const byHour = new Map<string, { temp?: number; ppm?: number }>();
  logs.forEach((l) => {
    const t = l.recordedAt ? hourKey(l.recordedAt) : '';
    if (!t) return;
    const cur = byHour.get(t) ?? {};
    if (l.metric === 'temp' || l.metric?.toLowerCase().includes('temp')) cur.temp = Number(l.value);
    if (l.metric === 'ppm' || l.metric?.toLowerCase().includes('ppm')) cur.ppm = Number(l.value);
    byHour.set(t, cur);
  });
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  return hours.map((time) => ({
    time,
    temp: byHour.get(time)?.temp ?? 4 + Math.random() * 3,
    ppm: byHour.get(time)?.ppm ?? 160 + Math.random() * 30,
  }));
}

function hourKey(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `今日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** FoundItemDto[] -> 寻物页招领展示（img 相对路径会拼 baseURL） */
export function foundItemsToDisplay(items: FoundItemDto[]): Array<{ id: number; title: string; location: string; desc: string; img: string }> {
  return items.map((f) => ({
    id: f.id,
    title: f.title ?? '',
    location: f.location ?? '',
    desc: f.description ?? '',
    img: f.imageUrl?.trim() ? resolveImageUrl(f.imageUrl) : `https://picsum.photos/seed/found${f.id}/800/600`,
  }));
}

const LOST_AVATAR_COLORS = [
  'from-rose-400 to-red-500',
  'from-purple-400 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-blue-400 to-cyan-500',
];

function formatLostTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay === 1) return `昨天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** LostItemDto[] -> 寻物页寻物展示（avatar/color/time 由后端数据推导） */
export function lostItemsToDisplay(items: LostItemDto[]): Array<{ id: number; user: string; avatar: string; color: string; time: string; item: string; location: string; desc: string }> {
  return items.map((l, i) => {
    const name = l.userName?.trim() || '匿名';
    const avatar = name.charAt(0).toUpperCase();
    return {
      id: l.id,
      user: name,
      avatar: avatar || '?',
      color: LOST_AVATAR_COLORS[i % LOST_AVATAR_COLORS.length],
      time: formatLostTime(l.createdAt),
      item: l.itemName ?? '',
      location: l.location ?? '',
      desc: l.description ?? '',
    };
  });
}

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  food: '菜品建议',
  service: '服务态度',
  env: '环境卫生',
  other: '其他',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  ai_replied: 'AI已建议',
  replied: '已回复',
};

/** 根据 ai_suggestion / reply_content 推断 status（与后端一致时可忽略） */
function normalizeStatus(p: PostDto): 'pending' | 'ai_replied' | 'replied' {
  if (p.status === 'replied') return 'replied';
  if (p.status === 'ai_replied' || p.status === 'in_progress') return 'ai_replied';
  const hasAi = (p.aiSuggestion?.trim() ?? '').length > 0;
  const hasReply = (p.replyContent?.trim() ?? '').length > 0;
  if (hasReply) return 'replied';
  if (hasAi) return 'ai_replied';
  return 'pending';
}

/** Post -> 留言墙一项；含问题类型、流程状态、AI建议、官方回复 */
export function postToFeedbackItem(p: PostDto, index: number): {
  id: number;
  type: string;
  time: string;
  content: string;
  reply: string | null;
  status: 'pending' | 'ai_replied' | 'replied';
  statusLabel: string;
  aiSuggestion: string | null;
  theme: 'cyan' | 'emerald' | 'violet' | 'amber';
} {
  const themes: ('cyan' | 'emerald' | 'violet' | 'amber')[] = ['cyan', 'emerald', 'violet', 'amber'];
  const created = p.createdAt ? new Date(p.createdAt).toLocaleString('zh-CN') : '';
  const typeLabel = p.feedbackType ? (FEEDBACK_TYPE_LABELS[p.feedbackType] ?? p.feedbackType) : (p.title ?? '其他');
  const status = normalizeStatus(p);
  return {
    id: p.id,
    type: typeLabel,
    time: created,
    content: p.content ?? '',
    reply: p.replyContent?.trim() || null,
    status,
    statusLabel: STATUS_LABELS[status] ?? '待处理',
    aiSuggestion: p.aiSuggestion?.trim() || null,
    theme: themes[index % themes.length],
  };
}
