/**
 * 登录与当前用户接口，对接后端 users 表（学生/老师共用 auth/login、users/me）
 * 演示用：token 直接存 localStorage，不加密。
 */

import { getBaseUrl, isApiConfigured } from "./client";

const TOKEN_KEY = "scs_mobile_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** 后端统一响应格式 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

/** 登录请求：学号/工号 作为 username */
export interface LoginParams {
  username: string;
  password: string;
  /** 验证码（若后端要求可传，移动端可先不实现） */
  code?: string;
}

/** 登录成功返回 */
export interface LoginResult {
  token: string;
}

/** 当前用户信息（与 users 表、users/me 一致） */
export interface CurrentUser {
  id?: number;
  username: string;
  roles?: string[];
}

function getBase(): string {
  const base = getBaseUrl();
  if (base) return base.replace(/\/$/, "");
  if (import.meta.env.VITE_API_SAME_ORIGIN === "true") return "";
  throw new Error("VITE_API_BASE_URL 未配置");
}

/**
 * 登录：学生用学号、老师用工号作为 username，与后端 users 表一致
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  const base = getBase();
  const res = await fetch(`${base}/api/v1/auth/mobile-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      username: params.username.trim(),
      password: params.password,
      ...(params.code != null && params.code !== "" && { code: params.code }),
    }),
  });
  const raw = await res.text();
  const body: ApiResponse<LoginResult> = raw ? JSON.parse(raw) : {};
  if (!res.ok) {
    const msg = body?.message || res.statusText || "登录失败";
    throw new Error(msg);
  }
  if (body?.code !== 0) {
    throw new Error(body?.message ?? "登录失败");
  }
  if (!body?.data?.token) {
    throw new Error("未返回 token");
  }
  setStoredToken(body.data.token);
  return body.data;
}

/**
 * 获取当前登录用户（需携带 token），用于登录后拉取姓名、角色等
 */
export async function getCurrentUser(token: string): Promise<CurrentUser> {
  const base = getBase();
  const res = await fetch(`${base}/api/v1/users/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const raw = await res.text();
  const body: ApiResponse<CurrentUser> = raw ? JSON.parse(raw) : {};
  if (!res.ok) {
    const msg = body?.message || res.statusText || "获取用户信息失败";
    throw new Error(msg);
  }
  if (body?.code !== 0) {
    throw new Error(body?.message ?? "获取用户信息失败");
  }
  if (!body?.data?.username) {
    throw new Error("用户信息不完整");
  }
  return body.data;
}

export { isApiConfigured };
