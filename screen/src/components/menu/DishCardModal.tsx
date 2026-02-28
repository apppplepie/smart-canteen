import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MapPin, Store, Flame, Info, Sparkles } from 'lucide-react';

export interface Dish {
  id: number;
  name: string;
  merchant: string;
  window: string;
  price: number;
  rating: number;
  tags: string[];
  image: string;
  desc: string;
  calories: number;
  sales: number;
}

interface DishCardModalProps {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DishCardModal({ dish, isOpen, onClose }: DishCardModalProps) {
  if (!dish) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] w-full max-w-lg relative flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Image Header */}
              <div className="relative h-64 shrink-0">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex gap-2 mb-3">
                    {dish.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-wide drop-shadow-lg">{dish.name}</h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-900 relative">
                {/* Subtle inner glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/5 blur-[50px] pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-cyan-400 font-bold text-xl">¥</span>
                    <span className="text-cyan-400 font-black text-4xl drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">{dish.price}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                    <Star size={16} className="fill-amber-400" />
                    {dish.rating}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">商家</p>
                      <p className="text-sm font-bold text-white">{dish.merchant}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">窗口号</p>
                      <p className="text-sm font-bold text-white">{dish.window}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 border border-rose-500/30">
                      <Flame size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">热量</p>
                      <p className="text-sm font-bold text-white">{dish.calories} kcal</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/30">
                      <Info size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">月售</p>
                      <p className="text-sm font-bold text-white">{dish.sales} 份</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="text-cyan-400 w-4 h-4" />
                    菜品简介
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
                    {dish.desc}
                  </p>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className="p-4 bg-slate-900 border-t border-white/10 flex gap-3 shrink-0 relative z-10">
                <button className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors">
                  加入收藏
                </button>
                <button className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95">
                  立即点餐
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
