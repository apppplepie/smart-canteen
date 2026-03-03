/** Re-export shared API client; mobile 使用 getBaseUrl 名 */
export {
  getApiBaseUrl as getBaseUrl,
  isApiConfigured,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "@scs/api";
