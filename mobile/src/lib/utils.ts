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
