import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { motion } from 'motion/react';
import { Search, MapPin, Store, Sparkles, Star } from 'lucide-react';
import { DishCardModal, Dish } from '../components/menu/DishCardModal';
import { useMenu } from '../hooks/useBackendData';

export default function Menu() {
  const { dishes: mockDishes, categories: menuCategories, loading } = useMenu();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [colCount, setColCount] = useState(4);
  const [pausedCol, setPausedCol] = useState<number | null>(null);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1280) setColCount(4);
      else if (window.innerWidth >= 1024) setColCount(3);
      else if (window.innerWidth >= 640) setColCount(2);
      else setColCount(1);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  return (
    <PageContainer>
      <style>{`
        @keyframes scroll-y-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scroll-y-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .animate-scroll-y-up { animation: scroll-y-up linear infinite; }
        .animate-scroll-y-down { animation: scroll-y-down linear infinite; }
      `}</style>
      <div className="bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative h-[calc(100vh-8rem)] flex flex-col p-4 md:p-6">
        
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 h-full relative z-10">
          
          {/* Sidebar Categories */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="搜索菜品、商家..." 
                  className="w-full bg-black/20 border border-white/10 text-slate-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-slate-500"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
              <div className="space-y-2">
                {menuCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-cyan-400'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Promo Card */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 text-white shadow-[0_0_30px_rgba(124,58,237,0.3)] relative overflow-hidden hidden md:block border border-white/10">
              <div className="absolute -right-4 -top-4 opacity-20">
                <Sparkles size={100} />
              </div>
              <div className="relative z-10">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-xs font-bold mb-3 inline-block">
                  今日特惠
                </span>
                <h3 className="text-xl font-black mb-1 tracking-wide">全场满减</h3>
                <p className="text-sm text-white/80 mb-4 font-medium">满 30 减 5，满 50 减 10</p>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-xl text-sm font-bold shadow-sm transition-colors">
                  立即领券
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Pseudo Masonry Grid */}
          <div className="flex-1 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                <div className="text-cyan-400 font-medium">加载中...</div>
              </div>
            )}
            {/* Gradient masks for smooth fade */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
            
            <div className="flex gap-6 h-full w-full px-2">
              {Array.from({ length: colCount }).map((_, colIndex) => {
                const colItems = mockDishes.filter((_, idx) => idx % colCount === colIndex);
                // Duplicate 4 times to ensure enough height for seamless scrolling
                const displayItems = [...colItems, ...colItems, ...colItems, ...colItems];
                const duration = 30; // 统一轮转速度 30s
                const isUp = colIndex % 2 === 0; // 偶数列向上，奇数列向下

                return (
                  <div key={colIndex} className="flex-1 h-full overflow-hidden relative group">
                    <div 
                      className={`flex flex-col gap-6 ${isUp ? 'animate-scroll-y-up' : 'animate-scroll-y-down'}`}
                      style={{ 
                        animationDuration: `${duration}s`,
                        animationPlayState: pausedCol === colIndex ? 'paused' : 'running'
                      }}
                    >
                      {displayItems.map((dish, idx) => (
                        <motion.div
                          key={`${dish.id}-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (idx % mockDishes.length) * 0.05 }}
                          onClick={() => {
                            setSelectedDish(dish);
                            setPausedCol(colIndex);
                          }}
                          className="bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] hover:border-cyan-500/30 transition-all duration-300"
                        >
                          <div className="relative">
                            <img src={dish.image} alt={dish.name} className="w-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                              {dish.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-cyan-300 text-xs font-bold rounded-lg shadow-sm">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent">
                              <h3 className="text-lg font-bold text-white mb-1 tracking-wide">{dish.name}</h3>
                              <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                                <Store size={12} className="text-cyan-400" />
                                <span>{dish.merchant}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-baseline gap-0.5 text-cyan-400">
                                <span className="text-sm font-bold">¥</span>
                                <span className="text-xl font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">{dish.price}</span>
                              </div>
                              <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                                <Star size={14} className="fill-amber-400" />
                                {dish.rating}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 bg-black/20 border border-white/5 p-2.5 rounded-xl">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-purple-400" />
                                <span className="font-medium">{dish.window}</span>
                              </div>
                              <span>月售 {dish.sales}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
      <DishCardModal 
        dish={selectedDish} 
        isOpen={!!selectedDish} 
        onClose={() => {
          setSelectedDish(null);
          setPausedCol(null);
        }} 
      />
    </PageContainer>
  );
}
