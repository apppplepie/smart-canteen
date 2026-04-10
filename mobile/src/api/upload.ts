import { getBaseUrl, isApiConfigured } from "./client";

export type UploadImageResult = {
  /** 写入数据库的相对路径，如 /api/images/comments/xxx.jpg */
  storedPath: string;
  /** 前端 <img src> 用的绝对地址 */
  displayUrl: string;
};

/** 上传图片到后端 /api/upload */
export async function uploadImageFile(file: File): Promise<UploadImageResult> {
  if (!isApiConfigured()) {
    throw new Error("未配置后端，无法上传图片");
  }
  const base = getBaseUrl().replace(/\/$/, "");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${base}/api/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `上传失败 (${res.status})`);
  }
  const data = (await res.json()) as { url?: string };
  const path = data.url?.trim();
  if (!path) throw new Error("服务器未返回图片地址");
  const displayUrl = path.startsWith("http")
    ? path
    : base + (path.startsWith("/") ? path : `/${path}`);
  return { storedPath: path, displayUrl };
}
