import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { OrderItem } from "./types";

export async function listOrderItems(): Promise<OrderItem[]> {
  return apiGet<OrderItem[]>("/api/order-items");
}

export async function listOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
  return apiGet<OrderItem[]>(`/api/order-items/order/${orderId}`);
}

export async function getOrderItem(id: number): Promise<OrderItem | null> {
  const res = await fetch((import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") + `/api/order-items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createOrderItem(body: {
  orderId: number;
  menuItemId: number;
  quantity: number;
  priceEach: number;
}): Promise<OrderItem> {
  return apiPost<OrderItem>("/api/order-items", body);
}

export async function updateOrderItem(id: number, body: Partial<OrderItem>): Promise<OrderItem> {
  return apiPut<OrderItem>(`/api/order-items/${id}`, { ...body, id });
}

export async function deleteOrderItem(id: number): Promise<void> {
  return apiDelete(`/api/order-items/${id}`);
}
