/**
 * 将后端 DTO 转成前端页面使用的结构
 */
import type { Dish } from '../components/menu/DishCardModal';
import type { VendorDto, MenuItemDto, QueueEntryDto, TestReportDto, RetainedSampleDto, SensorLogDto, PostDto } from '@scs/api';

const defaultImage = (id: number) => `https://picsum.photos/seed/dish${id}/600/800`;

/** MenuItem + Vendor -> Dish */
export function menuItemToDish(mi: MenuItemDto, vendor: VendorDto): Dish {
  return {
    id: mi.id,
    name: mi.name,
    merchant: vendor.name ?? '',
    window: vendor.locationLabel ?? '',
    price: Number(mi.price),
    rating: 4.5,
    tags: [],
    image: defaultImage(mi.id),
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

/** Post -> 留言墙一项（部分字段后端无则用默认） */
export function postToFeedbackItem(p: PostDto, index: number): {
  id: number;
  type: string;
  time: string;
  content: string;
  reply: string | null;
  status: 'replied' | 'pending';
  theme: 'cyan' | 'emerald' | 'violet' | 'amber';
} {
  const themes: ('cyan' | 'emerald' | 'violet' | 'amber')[] = ['cyan', 'emerald', 'violet', 'amber'];
  const created = p.createdAt ? new Date(p.createdAt).toLocaleString('zh-CN') : '';
  return {
    id: p.id,
    type: p.title ?? '其他',
    time: created,
    content: p.content ?? '',
    reply: p.commentCount && p.commentCount > 0 ? '已收到反馈，感谢您的留言。' : null,
    status: (p.commentCount && p.commentCount > 0 ? 'replied' : 'pending') as 'replied' | 'pending',
    theme: themes[index % themes.length],
  };
}
