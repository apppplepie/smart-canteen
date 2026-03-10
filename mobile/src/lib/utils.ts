import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO date to relative time (e.g. "2小时前", "昨天") */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "刚刚";
  if (diffM < 60) return `${diffM}分钟前`;
  if (diffH < 24) return `${diffH}小时前`;
  if (diffD === 1) return "昨天";
  if (diffD < 7) return `${diffD}天前`;
  return d.toLocaleDateString("zh-CN");
}

/** 帖子标签样式（寻物/招领/问题反馈及反馈子类型） */
export function getPostTagClassName(tag: string): string {
  const map: Record<string, string> = {
    寻物启事: "bg-orange-50 text-orange-500",
    失物招领: "bg-blue-50 text-blue-500",
    问题反馈: "bg-red-50 text-[#FF6B6B]",
    菜品建议: "bg-amber-50 text-amber-600",
    服务态度: "bg-violet-50 text-violet-600",
    环境卫生: "bg-emerald-50 text-emerald-600",
    其他: "bg-slate-100 text-slate-600",
  };
  return map[tag] ?? "bg-gray-50 text-gray-500";
}
