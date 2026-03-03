import React from "react";
import { ChevronLeft, Search, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { THEME } from "../config/theme";

const ALL_ORDERS = [
  {
    id: 1,
    name: "健康轻食沙拉",
    time: "昨天 12:30",
    price: "28.00",
    status: "已完成",
    image: "https://picsum.photos/seed/m2/100/100",
    items: "招牌鸡胸肉沙拉 x1",
  },
  {
    id: 2,
    name: "日式咖喱屋",
    time: "周二 18:15",
    price: "32.50",
    status: "已完成",
    image: "https://picsum.photos/seed/m4/100/100",
    items: "炸猪排咖喱饭 x1",
  },
  {
    id: 3,
    name: "川香麻辣烫",
    time: "周一 12:00",
    price: "18.50",
    status: "已完成",
    image: "https://picsum.photos/seed/m1/100/100",
    items: "自选麻辣烫 x1",
  },
  {
    id: 4,
    name: "老北京炸酱面",
    time: "上周五 11:30",
    price: "15.00",
    status: "已完成",
    image: "https://picsum.photos/seed/m3/100/100",
    items: "经典炸酱面 x1",
  },
  {
    id: 5,
    name: "健康轻食沙拉",
    time: "上周三 12:15",
    price: "35.00",
    status: "已完成",
    image: "https://picsum.photos/seed/m2/100/100",
    items: "牛肉减脂餐 x1",
  },
];

export function HistoryOrdersPage({ onBack }: { onBack: () => void }) {
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
              className="w-full bg-white rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all shadow-sm border border-gray-100"
            />
          </div>

          <div className="space-y-4">
            {ALL_ORDERS.map((order) => (
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
                  <button className="px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    评价
                  </button>
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
        </div>
      </div>
    </motion.div>
  );
}
