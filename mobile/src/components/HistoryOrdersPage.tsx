import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Search, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { THEME } from "../config/theme";
import { listOrdersByUser } from "../api/orders";
import { listVendors } from "../api/vendors";
import { formatRelativeTime } from "../lib/utils";
import { getBaseUrl, isApiConfigured } from "../api/client";
import { historyOrdersFallbackMock } from "../mocks/historyOrders";
import { SCS_ORDERS_UPDATED } from "../lib/ordersEvents";

type OrderRow = {
  id: number;
  name: string;
  time: string;
  price: string;
  status: string;
  image: string;
  items: string;
  vendorId?: number;
  totalAmount: number;
  /** 已评价则不可再选为评价订单 */
  reviewedAt?: string | null;
};

export function HistoryOrdersPage({
  onBack,
  userId,
  onSelectOrder,
}: {
  onBack: () => void;
  userId?: number;
  onSelectOrder?: (order: { orderId?: number; vendorId?: number; totalAmount: number; vendorName?: string; image?: string }) => void;
}) {
  const [orders, setOrders] = useState<OrderRow[]>(historyOrdersFallbackMock);
  const [loading, setLoading] = useState(isApiConfigured());
  const [search, setSearch] = useState("");

  const orderStatusToChinese = (status: string): string => {
    const s = (status ?? "").toLowerCase();
    if (s === "pending" || s === "待接单") return "待接单";
    if (s === "confirmed" || s === "已接单") return "已接单";
    if (s === "preparing" || s === "cooking" || s === "制作中") return "制作中";
    if (s === "ready" || s === "待取餐") return "请取餐";
    if (s === "completed" || s === "已完成" || s === "done") return "取餐成功";
    return status || "取餐成功";
  };

  const isOrderCompleted = (status: string): boolean => {
    const s = (status ?? "").toLowerCase();
    return s === "completed" || s === "已完成" || s === "done";
  };

  const fetchOrders = useCallback(async () => {
    const base = getBaseUrl();
    if (!isApiConfigured() || userId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await listOrdersByUser(userId);
      const vendors = await listVendors();
      const baseNorm = base.replace(/\/$/, "");
      const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
      const vendorImageMap = new Map(
        vendors.map((v) => {
          const url =
            v.imageUrl != null && v.imageUrl !== ""
              ? v.imageUrl.startsWith("http")
                ? v.imageUrl
                : baseNorm + (v.imageUrl!.startsWith("/") ? v.imageUrl : "/" + v.imageUrl)
              : `https://picsum.photos/seed/v${v.id}/100/100`;
          return [v.id, url] as [number, string];
        })
      );
      const rows: OrderRow[] = list
        .filter((o) => isOrderCompleted(o.status ?? ""))
        .map((o) => ({
          id: o.id,
          name: vendorMap.get(o.vendorId ?? 0) ?? "订单",
          time: o.placedAt ? formatRelativeTime(o.placedAt) : "",
          price: String(o.totalAmount),
          status: orderStatusToChinese(o.status ?? "已完成"),
          image: vendorImageMap.get(o.vendorId ?? 0) ?? `https://picsum.photos/seed/v${o.vendorId ?? o.id}/100/100`,
          items: `¥${o.totalAmount}`,
          vendorId: o.vendorId,
          totalAmount: Number(o.totalAmount),
          reviewedAt: o.reviewedAt ?? null,
        }));
      setOrders(rows.length ? rows : historyOrdersFallbackMock);
    } catch {
      setOrders(historyOrdersFallbackMock);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isApiConfigured() || userId == null) {
      setLoading(false);
      return;
    }
    void fetchOrders();
  }, [userId, fetchOrders]);

  useEffect(() => {
    const onUpdated = () => {
      void fetchOrders();
    };
    window.addEventListener(SCS_ORDERS_UPDATED, onUpdated);
    return () => window.removeEventListener(SCS_ORDERS_UPDATED, onUpdated);
  }, [fetchOrders]);

  const searchLower = search.trim().toLowerCase();
  const filtered = searchLower
    ? orders.filter((o) => o.name.toLowerCase().includes(searchLower))
    : orders;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed inset-0 bg-gray-50 z-[100] flex flex-col"
    >
      {/* Header */}
      <div 
        className="px-6 pt-6 pb-3 sticky top-0 z-10 shadow-sm flex items-center gap-4 text-white"
        style={{ backgroundColor: THEME.colors.primary }}
      >
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">历史订单</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
        <div className="max-w-2xl mx-auto space-y-4">
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索订单..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all shadow-sm border border-gray-100"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#FF6B6B]" />
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">{order.name}</span>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                    <span className="text-base text-gray-600 font-medium">{order.status}</span>
                  </div>

                  <div className="flex gap-4">
                    <img
                      src={order.image}
                      alt={order.name}
                      className="w-20 h-20 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="text-base text-gray-600">{order.items}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-400">{order.time}</span>
                        <span className="font-bold text-gray-900 text-base">¥{order.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end gap-3">
                    {onSelectOrder && (
                      order.reviewedAt ? (
                        <span className="px-4 py-1.5 rounded-full border border-gray-100 text-sm font-medium text-gray-400 bg-gray-50">
                          已评价
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            onSelectOrder({
                              orderId: order.id,
                              vendorId: order.vendorId,
                              totalAmount: order.totalAmount,
                              vendorName: order.name,
                              image: order.image,
                            })
                          }
                          className="px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          选为评价订单
                        </button>
                      )
                    )}
                    <button
                      className="px-4 py-1.5 rounded-full text-sm font-medium text-white transition-colors shadow-sm"
                      style={{ backgroundColor: THEME.colors.primary }}
                    >
                      再来一单
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
