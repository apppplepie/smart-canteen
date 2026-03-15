import React from "react";
import { MapPin, Star, Clock, ChevronRight, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface MealRecommendationCardProps {
  merchantName: string;
  dishName: string;
  rating: number;
  time: string;
  image: string;
  onOrder: () => void;
}

export function MealRecommendationCard({
  merchantName,
  dishName,
  rating,
  time,
  image,
  onOrder,
}: MealRecommendationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md max-w-sm w-full"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={image}
          alt={merchantName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
          <Clock size={10} />
          {time}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{merchantName}</h3>
            <p className="text-sm text-[#FF6B6B] font-medium mt-0.5">{dishName}</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700">{rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <MapPin size={12} />
          <span>2F 西区 · 减脂餐专区</span>
        </div>

        <button
          onClick={onOrder}
          className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B6B]/20 hover:shadow-xl hover:shadow-[#FF6B6B]/30 transition-all active:scale-95"
        >
          <ShoppingBag size={16} />
          点击下单
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
