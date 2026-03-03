import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { OrderDto } from "./types";

export async function listOrders(): Promise<OrderDto[]> {
  return apiGet<OrderDto[]>("/api/orders");
}

export async function listOrdersByUser(userId: number): Promise<OrderDto[]> {
  return apiGet<OrderDto[]>(`/api/orders/user/${userId}`);
}

export async function listOrdersByVendor(vendorId: number): Promise<OrderDto[]> {
  return apiGet<OrderDto[]>(`/api/orders/vendor/${vendorId}`);
}

export async function getOrder(id: number): Promise<OrderDto | null> {
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ?? "";
  const url = (typeof base === "string" ? base.replace(/\/$/, "") : "") + `/api/orders/${id}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createOrder(body: Partial<OrderDto> & { totalAmount: number }): Promise<OrderDto> {
  return apiPost<OrderDto>("/api/orders", body);
}

export async function updateOrder(id: number, body: Partial<OrderDto>): Promise<OrderDto> {
  return apiPut<OrderDto>(`/api/orders/${id}`, { ...body, id });
}

export async function deleteOrder(id: number): Promise<void> {
  return apiDelete(`/api/orders/${id}`);
}
