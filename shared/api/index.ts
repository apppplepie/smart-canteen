/**
 * 共享 API 层：mobile / screen 共用，高内聚低耦合。
 * - client: 请求封装与 baseURL
 * - types: 与 backend 一致的 DTO
 * - 各 resource 模块: 仅负责该资源的 CRUD，不包含 UI 适配
 */
export {
  getApiBaseUrl,
  isApiConfigured,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "./client";

export type {
  UserDto,
  VendorDto,
  MenuItemDto,
  MaterialDto,
  PostDto,
  FoundItemDto,
  LostItemDto,
  OrderDto,
  OrderItemDto,
  QueueEntryDto,
  TestReportDto,
  RetainedSampleDto,
  SensorLogDto,
  CallEventDto,
  AllergenDisclosureDto,
} from "./types";

export * from "./vendors";
export * from "./menuItems";
export * from "./posts";
export * from "./orders";
export * from "./orderItems";
export * from "./queueEntries";
export * from "./testReports";
export * from "./retainedSamples";
export * from "./sensorLogs";
