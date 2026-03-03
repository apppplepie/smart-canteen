import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { Order } from "./types";

export async function listOrders(): Promise<Order[]> {
  return apiGet<Order[]>("/api/orders");
}

export async function listOrdersByUser(userId: number): Promise<Order[]> {
  return apiGet<Order[]>(`/api/orders/user/${userId}`);
}

export async function listOrdersByVendor(vendorId: number): Promise<Order[]> {
  return apiGet<Order[]>(`/api/orders/vendor/${vendorId}`);
}

export async function getOrder(id: number): Promise<Order | null> {
  const res = await fetch((import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") + `/api/orders/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createOrder(body: {
  userId?: number;
  vendorId?: number;
  totalAmount: number;
  status?: string;
  queueNumber?: string;
}): Promise<Order> {
  return apiPost<Order>("/api/orders", body);
}

export async function updateOrder(id: number, body: Partial<Order>): Promise<Order> {
  return apiPut<Order>(`/api/orders/${id}`, { ...body, id });
}

export async function deleteOrder(id: number): Promise<void> {
  return apiDelete(`/api/orders/${id}`);
}
