import React, { useState } from "react";
import { Search, Star, Clock, MapPin, ChevronRight, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MerchantPage } from "./MerchantPage";

import { THEME } from "../config/theme";

const MERCHANTS = [
  {
    id: 1,
    name: "川香麻辣烫",
    rating: 4.8,
    reviews: 1205,
    time: "10-15 min",
    distance: "1F 东区",
    tags: ["麻辣鲜香", "自选"],
    image: "https://picsum.photos/seed/m1/400/300",
    popular: true,
  },
  {
    id: 2,
    name: "健康轻食沙拉",
    rating: 4.9,
    reviews: 890,
    time: "5-10 min",
    distance: "2F 西区",
    tags: ["低脂", "减脂餐"],
    image: "https://picsum.photos/seed/m2/400/300",
    popular: false,
  },
  {
    id: 3,
    name: "老北京炸酱面",
    rating: 4.6,
    reviews: 2300,
    time: "15-20 min",
    distance: "1F 中区",
    tags: ["面食", "地道"],
    image: "https://picsum.photos/seed/m3/400/300",
    popular: true,
  },
  {
    id: 4,
    name: "日式咖喱屋",
    rating: 4.7,
    reviews: 650,
    time: "10-15 min",
    distance: "2F 东区",
    tags: ["咖喱", "日料"],
    image: "https://picsum.photos/seed/m4/400/300",
    popular: false,
  },
];

export function OrderingTab() {
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  return (
    <div className="h-full bg-gray-50 flex flex-col relative">
      <AnimatePresence>
        {selectedMerchant ? (
          <MerchantPage
            merchant={selectedMerchant}
            onBack={() => setSelectedMerchant(null)}
            key="merchant-page"
          />
        ) : (
          <motion.div
            key="ordering-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 overflow-y-auto no-scrollbar pb-20"
          >
            {/* Header */}
            <div 
              className="px-6 pt-6 pb-3 sticky top-0 z-10 shadow-sm"
              style={{ backgroundColor: THEME.colors.primary }}
            >
              <div className="max-w-7xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="搜索食堂商家、菜品..." 
                    className="w-full bg-white rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="px-6 py-6">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 max-w-7xl mx-auto">
                {['全部', '面食', '米饭', '轻食', '饮品', '小吃'].map((cat, i) => (
                  <button 
                    key={cat}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                      i === 0 ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchants List */}
            <div className="px-6 pb-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    附近推荐 <Flame className="text-orange-500" size={18} />
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {MERCHANTS.map((merchant) => (
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
