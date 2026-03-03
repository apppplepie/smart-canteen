import React, { useState, useMemo, useEffect } from "react";
import { Search, Star, Clock, MapPin, Flame, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MerchantPage } from "./MerchantPage";
import { cn } from "../lib/utils";
import { THEME } from "../config/theme";
import { listVendors } from "../api/vendors";
import { getBaseUrl } from "../api/client";

type Merchant = {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  time: string;
  distance: string;
  tags: string[];
  image: string;
  popular: boolean;
};

const FALLBACK_MERCHANTS: Merchant[] = [
  { id: 1, name: "川香麻辣烫", rating: 4.8, reviews: 1205, time: "10-15 min", distance: "1F 东区", tags: ["麻辣鲜香", "自选"], image: "https://picsum.photos/seed/m1/400/300", popular: true },
  { id: 2, name: "健康轻食沙拉", rating: 4.9, reviews: 890, time: "5-10 min", distance: "2F 西区", tags: ["低脂", "减脂餐"], image: "https://picsum.photos/seed/m2/400/300", popular: false },
  { id: 3, name: "老北京炸酱面", rating: 4.6, reviews: 2300, time: "15-20 min", distance: "1F 中区", tags: ["面食", "地道"], image: "https://picsum.photos/seed/m3/400/300", popular: true },
  { id: 4, name: "日式咖喱屋", rating: 4.7, reviews: 650, time: "10-15 min", distance: "2F 东区", tags: ["咖喱", "日料"], image: "https://picsum.photos/seed/m4/400/300", popular: false },
];

export function OrderingTab({ user }: { user?: { userId?: number } | null }) {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [activeTab, setActiveTab] = useState<"推荐" | "最快">("推荐");
  const [merchants, setMerchants] = useState<Merchant[]>(FALLBACK_MERCHANTS);
  const [loading, setLoading] = useState(!!getBaseUrl());

  useEffect(() => {
    const base = getBaseUrl();
    if (!base) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listVendors();
        if (cancelled) return;
        const mapped: Merchant[] = list.map((v) => ({
          id: v.id,
          name: v.name,
          rating: 4.5,
          reviews: 500,
          time: "10-15 min",
          distance: v.locationLabel ?? "食堂",
          tags: v.description ? [v.description.slice(0, 6)] : ["美食"],
          image: `https://picsum.photos/seed/m${v.id}/400/300`,
          popular: v.id % 2 === 1,
        }));
        setMerchants(mapped.length ? mapped : FALLBACK_MERCHANTS);
      } catch {
        if (!cancelled) setMerchants(FALLBACK_MERCHANTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sortedMerchants = useMemo(() => {
    if (activeTab === "最快") {
      return [...merchants].sort((a, b) => {
        const timeA = parseInt(a.time.split("-")[0], 10) || 10;
        const timeB = parseInt(b.time.split("-")[0], 10) || 10;
        return timeA - timeB;
      });
    }
    return merchants;
  }, [merchants, activeTab]);

  return (
    <div className="h-full bg-gray-50 flex flex-col relative overflow-y-auto no-scrollbar pb-24">
      <AnimatePresence>
        {selectedMerchant ? (
          <MerchantPage
            merchant={selectedMerchant}
            onBack={() => setSelectedMerchant(null)}
            user={user}
            key="merchant-page"
          />
        ) : null}
      </AnimatePresence>

      {/* Header */}
      <div 
        className="px-6 pt-6 pb-24 text-white relative overflow-hidden"
        style={{ backgroundColor: THEME.colors.primary }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex items-end gap-6">
            <h1 className="text-2xl font-bold">点餐</h1>
            <div className="flex gap-4 mb-0.5">
              <button 
                onClick={() => setActiveTab("推荐")}
                className={cn(
                  "text-sm font-bold pb-1 transition-all relative",
                  activeTab === "推荐" ? "text-white" : "text-white/70"
                )}
              >
                推荐
                {activeTab === "推荐" && (
                  <motion.div layoutId="ordering-tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab("最快")}
                className={cn(
                  "text-sm font-bold pb-1 transition-all relative",
                  activeTab === "最快" ? "text-white" : "text-white/70"
                )}
              >
                最快
                {activeTab === "最快" && (
                  <motion.div layoutId="ordering-tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-12 md:-mt-16 relative z-10 space-y-6 md:space-y-8">
        {/* Search & Categories Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="搜索食堂商家、菜品..." 
                    className="w-full bg-gray-50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 transition-all border border-gray-100"
                  />
                </div>
                
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {['全部', '面食', '米饭', '轻食', '饮品', '小吃'].map((cat, i) => (
                    <button 
                      key={cat}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        i === 0 ? 'bg-[#FF6B6B] text-white shadow-sm shadow-red-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
        </div>

        {/* Merchants List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              附近推荐 <Flame className="text-orange-500" size={18} />
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#FF6B6B]" />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sortedMerchants.map((merchant) => (
              <motion.div 
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                key={merchant.id}
                onClick={() => setSelectedMerchant(merchant)}
                className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-all"
              >
                <img 
                  src={merchant.image} 
                  alt={merchant.name} 
                  className="w-28 h-28 rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 py-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{merchant.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center text-amber-500 font-medium">
                        <Star size={12} className="fill-amber-500 mr-0.5" /> {merchant.rating}
                      </span>
                      <span>月售 {merchant.reviews}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {merchant.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-1 bg-gray-50 text-gray-600 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock size={12} /> {merchant.time}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {merchant.distance}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
