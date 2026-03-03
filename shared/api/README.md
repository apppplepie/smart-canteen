# 共享 API 层 (shared/api)

供 **mobile** 与 **screen** 共用，对接 backend 的 REST 接口。设计原则：高内聚、低耦合。

## 结构

- **client.ts** — 请求封装：`getApiBaseUrl()`、`isApiConfigured()`、`apiGet` / `apiPost` / `apiPut` / `apiDelete`。未配置 `VITE_API_BASE_URL` 时 `isApiConfigured()` 为 false，请求方法会抛错，便于各端回退 mock。
- **types.ts** — 与 backend 实体一致的 DTO（VendorDto、MenuItemDto、PostDto、OrderDto、QueueEntryDto、TestReportDto、RetainedSampleDto、SensorLogDto 等）。
- **各 resource 模块**（vendors、menuItems、posts、orders、orderItems、queueEntries、testReports、retainedSamples、sensorLogs）— 仅负责该资源的 CRUD，不包含 UI 适配。

## 使用方式

- **mobile**：通过别名 `@scs/api` 引用，并在 `mobile/src/api` 中 re-export；mobile 独有逻辑（如 `mapPost` → SharedPost）保留在 mobile。
- **screen**：通过别名 `@scs/api` 引用，`screen/src/api` 中 re-export client 与 types；screen 独有适配（DTO → 大屏 UI 结构）保留在 `screen/src/api/adapters.ts`。

## 配置

各前端项目在 `.env` 中配置 `VITE_API_BASE_URL`（如 `http://localhost:8080`），不配置则使用 mock 数据。
