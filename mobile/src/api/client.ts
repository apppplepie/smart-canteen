/**
 * 移动端 base：同站部署（VITE_API_SAME_ORIGIN）时用 window.origin 拼接资源 URL，与 shared 内 fetch 行为一致。
 */
import {
  getEffectiveApiBaseUrl,
  isApiConfigured,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  ApiError,
} from "@scs/api";

export function getBaseUrl(): string {
  return getEffectiveApiBaseUrl();
}

export {
  isApiConfigured,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  ApiError,
};
