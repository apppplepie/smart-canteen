import React, { useState, useEffect } from "react";
import { ChevronLeft, Search, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { THEME } from "../config/theme";
import { listOrdersByUser } from "../api/orders";
import { listVendors } from "../api/vendors";
import { formatRelativeTime } from "../lib/utils";
import { getBaseUrl } from "../api/client";

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
};

const FALLBACK_ORDERS: OrderRow[] = [
  { id: 1, name: "健康轻食沙拉", time: "昨天 12:30", price: "28.00", status: "已完成", image: "https://picsum.photos/seed/m2/100/100", items: "招牌鸡胸肉沙拉 x1", totalAmount: 28 },
  { id: 2, name: "日式咖喱屋", time: "周二 18:15", price: "32.50", status: "已完成", image: "https://picsum.photos/seed/m4/100/100", items: "炸猪排咖喱饭 x1", totalAmount: 32.5 },
  { id: 3, name: "川香麻辣烫", time: "周一 12:00", price: "18.50", status: "已完成", image: "https://picsum.photos/seed/m1/100/100", items: "自选麻辣烫 x1", totalAmount: 18.5 },
];

export function HistoryOrdersPage({
  onBack,
  userId,
  onSelectOrder,
}: {
  onBack: () => void;
  userId?: number;
  onSelectOrder?: (order: { vendorId?: number; totalAmount: number; vendorName?: string; image?: string }) => void;
}) {
  const [orders, setOrders] = useState<OrderRow[]>(FALLBACK_ORDERS);
  const [loading, setLoading] = useState(!!getBaseUrl());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const base = getBaseUrl();
    if (!base || userId == null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listOrdersByUser(userId);
        if (cancelled) return;
        const vendors = await listVendors();
        const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
        const rows: OrderRow[] = list.map((o) => ({
          id: o.id,
          name: vendorMap.get(o.vendorId ?? 0) ?? "订单",
          time: o.placedAt ? formatRelativeTime(o.placedAt) : "",
          price: String(o.totalAmount),
          status: o.status ?? "已完成",
          image: `https://picsum.photos/seed/v${o.vendorId ?? o.id}/100/100`,
          items: `¥${o.totalAmount}`,
          vendorId: o.vendorId,
          totalAmount: Number(o.totalAmount),
        }));
        setOrders(rows.length ? rows : FALLBACK_ORDERS);
      } catch {
        if (!cancelled) setOrders(FALLBACK_ORDERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const filtered = search.trim()
    ? orders.filter((o) => o.name.includes(search) || o.items.includes(search))
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
                      <span className="font-bold text-gray-900">{order.name}</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">{order.status}</span>
                  </div>

                  <div className="flex gap-4">
                    <img
                      src={order.image}
                      alt={order.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="text-sm text-gray-600">{order.items}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{order.time}</span>
                        <span className="font-bold text-gray-900">¥{order.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end gap-3">
                    {onSelectOrder && (
                      <button
                        onClick={() =>
                          onSelectOrder({
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
