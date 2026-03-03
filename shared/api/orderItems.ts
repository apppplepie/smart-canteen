import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { OrderItemDto } from "./types";

export async function listOrderItems(): Promise<OrderItemDto[]> {
  return apiGet<OrderItemDto[]>("/api/order-items");
}

export async function listOrderItemsByOrder(orderId: number): Promise<OrderItemDto[]> {
  return apiGet<OrderItemDto[]>(`/api/order-items/order/${orderId}`);
}

export async function getOrderItem(id: number): Promise<OrderItemDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/order-items/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createOrderItem(body: {
  orderId: number;
  menuItemId: number;
  quantity: number;
  priceEach: number;
}): Promise<OrderItemDto> {
  return apiPost<OrderItemDto>("/api/order-items", body);
}

export async function updateOrderItem(id: number, body: Partial<OrderItemDto>): Promise<OrderItemDto> {
  return apiPut<OrderItemDto>(`/api/order-items/${id}`, { ...body, id });
}

export async function deleteOrderItem(id: number): Promise<void> {
  return apiDelete(`/api/order-items/${id}`);
}
