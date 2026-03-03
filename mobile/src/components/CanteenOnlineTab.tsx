import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  ThumbsUp, 
  Utensils, 
  Coffee, 
  IceCream, 
  Pizza, 
  Ticket, 
  CalendarDays, 
  MessageSquareWarning, 
  ChefHat,
  Search,
  CheckCircle2
} from "lucide-react";
import { THEME } from "../config/theme";
import { MerchantPage } from "./MerchantPage";
import { FeedbackPage } from "./FeedbackPage";
import { LostItemPage } from "./LostItemPage";
import { FoundItemPage } from "./FoundItemPage";

// Helper to get color based on crowd level (0-100)
const getHeatColor = (level: number) => {
  if (level < 20) return "bg-emerald-400 text-white";
  if (level < 40) return "bg-emerald-500 text-white";
  if (level < 60) return "bg-amber-400 text-white";
  if (level < 80) return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
};

export function CanteenOnlineTab() {
  const [crowdLevels, setCrowdLevels] = useState<number[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [activeService, setActiveService] = useState<"feedback" | "lost" | "found" | null>(null);

  // Initialize and update crowd levels
  useEffect(() => {
    const generateLevels = () => Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
    setCrowdLevels(generateLevels());

    const interval = setInterval(() => {
      setCrowdLevels(generateLevels());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const bestWindowIndex = useMemo(() => {
    if (crowdLevels.length === 0) return 0;
    let minIndex = 0;
    for (let i = 1; i < crowdLevels.length; i++) {
      if (crowdLevels[i] < crowdLevels[minIndex]) {
        minIndex = i;
      }
    }
    return minIndex;
  }, [crowdLevels]);

  const handleWindowClick = (index: number) => {
    // Mock merchant data for the selected window
    setSelectedMerchant({
      id: index + 1,
      name: `${index + 1}号窗口 - 特色美食`,
      rating: 4.8,
      sales: 1200,
      deliveryTime: "10-15分钟",
      distance: "100m",
      image: `https://picsum.photos/seed/w${index + 1}/800/400`,
      tags: ["人少免排队", "出餐快"],
    });
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative overflow-y-auto no-scrollbar pb-24">
      <AnimatePresence>
        {selectedMerchant && (
          <MerchantPage 
            merchant={selectedMerchant} 
            onBack={() => setSelectedMerchant(null)} 
          />
        )}
        {activeService === "feedback" && <FeedbackPage onBack={() => setActiveService(null)} />}
        {activeService === "lost" && <LostItemPage onBack={() => setActiveService(null)} />}
        {activeService === "found" && <FoundItemPage onBack={() => setActiveService(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-[#FF6B6B] px-6 pt-6 pb-24 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold">食堂在线</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-12 md:-mt-16 relative z-10 space-y-6 md:space-y-8">
        
        {/* Heatmap Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Flame className="text-orange-500" size={20} />
              实时排队热力图
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>空闲</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div>适中</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>拥挤</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 md:gap-3 mb-6">
            {crowdLevels.map((level, i) => (
              <motion.button
                key={i}
                layout
                onClick={() => handleWindowClick(i)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105 shadow-sm ${getHeatColor(level)} ${i === bestWindowIndex ? 'ring-4 ring-[#FF6B6B] ring-offset-2' : ''}`}
              >
                <span className="text-sm md:text-base font-bold">{i + 1}</span>
                <span className="text-[10px] md:text-xs opacity-80">{level}%</span>
              </motion.button>
            ))}
          </div>

          {/* Recommendation */}
          {crowdLevels.length > 0 && (
            <div 
              onClick={() => handleWindowClick(bestWindowIndex)}
              className="bg-red-50 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors border border-red-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <ThumbsUp className="text-[#FF6B6B]" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">智能推荐最优窗口</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {bestWindowIndex + 1}号窗口目前人最少，预计无需等待
                  </p>
                </div>
              </div>
              <button className="px-4 py-1.5 bg-[#FF6B6B] text-white text-xs font-bold rounded-full shadow-sm">
                去点餐
              </button>
            </div>
          )}
        </div>

        {/* Online Services */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">线上服务</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { id: "feedback", icon: MessageSquareWarning, label: "问题反馈", color: "text-red-500", bg: "bg-red-50" },
              { id: "lost", icon: Search, label: "寻物启事", color: "text-orange-500", bg: "bg-orange-50" },
              { id: "found", icon: CheckCircle2, label: "失物招领", color: "text-blue-500", bg: "bg-blue-50" },
              { id: "reserve", icon: Utensils, label: "包厢预订", color: "text-indigo-500", bg: "bg-indigo-50" },
              { id: "ticket", icon: Ticket, label: "饭票充值", color: "text-amber-500", bg: "bg-amber-50" },
              { id: "menu", icon: CalendarDays, label: "本周菜单", color: "text-green-500", bg: "bg-green-50" },
              { id: "tea", icon: Coffee, label: "下午茶", color: "text-amber-700", bg: "bg-amber-50" },
              { id: "dessert", icon: IceCream, label: "甜品站", color: "text-pink-500", bg: "bg-pink-50" },
            ].map((service, i) => (
              <button 
                key={i} 
                onClick={() => setActiveService(service.id as any)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${service.bg}`}>
                  <service.icon className={service.color} size={24} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{service.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
